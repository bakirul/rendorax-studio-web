// app/api/picture-lock/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn(
      "⚠️ Service role credentials empty during compilation. Utilizing build-safe placeholder client.",
    );
    return createAdminClient(
      supabaseUrl || "https://placeholder-project.supabase.co",
      supabaseServiceKey || "placeholder-token-for-build-pass",
    );
  }

  return createAdminClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, duration, frameRate } = await req.json();

    if (!fileName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: signedUrlData, error: signError } =
      await supabaseAdmin.storage
        .from("client-vault")
        .createSignedUrl(fileName, 60);

    if (signError || !signedUrlData) {
      throw new Error("Could not access file for hashing");
    }

    const response = await fetch(signedUrlData.signedUrl);
    if (!response.body) throw new Error("Failed to stream file");

    const hash = crypto.createHash("sha256");
    hash.update(`filename:${fileName}|duration:${duration}|fps:${frameRate}`);

    const reader = response.body.getReader();
    let done = false;

    while (!done) {
      const { value, done: isDone } = await reader.read();
      if (value) {
        hash.update(value);
      }
      done = isDone;
    }

    const finalHash = hash.digest("hex");

    const { error: dbError } = await supabaseAdmin
      .from("video_metadata")
      .upsert(
        {
          file_name: fileName,
          is_locked: true,
          integrity_hash: finalHash,
          locked_by: user.id,
          locked_at: new Date().toISOString(),
          metadata: { duration, frameRate },
        },
        { onConflict: "file_name" },
      )
      .select();

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      message: "Picture Lock Applied Successfully",
      hash: finalHash,
    });
  } catch (error) {
    console.error("[Picture Lock Error]:", error);
    return NextResponse.json(
      { error: "Failed to process picture lock" },
      { status: 500 },
    );
  }
}
