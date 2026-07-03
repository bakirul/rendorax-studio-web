// app/api/upload-chunk/route.ts
import { NextRequest, NextResponse } from "next/server";

// ============================================================================
// [DEPRECATED] LOCAL CHUNKING & FFMPEG LOGIC
// ============================================================================
// WARNING: This route is being deprecated as part of Phase 1 Infrastructure
// updates. Vercel Serverless environments do not support persistent
// os.tmpdir() storage or long-running fluent-ffmpeg processes.
//
// ACTION: The client-side uploader must be updated to use Supabase
// Resumable Uploads (TUS protocol) directly to the storage bucket.
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    // 1. Temporarily Accept the Request (to prevent immediate 500 errors if UI is untouched)
    const formData = await req.formData();
    const fileId = formData.get("fileId");

    // 2. We no longer write to fs.writeFile or os.tmpdir() here.
    // In a fully migrated state, this endpoint shouldn't receive video chunks.

    console.warn(
      `[API] Deprecated upload-chunk route hit for fileId: ${fileId}. Client must use Supabase direct uploads.`,
    );

    // 3. Return a graceful error/directive forcing the client to use the new flow
    return NextResponse.json(
      {
        error: "Local chunk uploads are deprecated.",
        directive: "USE_SUPABASE_TUS",
        message:
          "Please upgrade your client uploader to use Supabase direct storage uploads.",
      },
      { status: 410 }, // 410 Gone: Indicates the resource is no longer available at this endpoint.
    );
  } catch (error: any) {
    console.error("[Upload API Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
