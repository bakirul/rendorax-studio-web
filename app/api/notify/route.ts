import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

// ১. জেড (Zod) স্কিমা দিয়ে ইনপুট ডেটা কঠোরভাবে ভ্যালিডেশন করা
const notifySchema = z.object({
  clientEmail: z.string().email("Invalid client email address"),
  folderName: z.string().nullable().optional(),
  fileCount: z.union([z.string(), z.number()]),
});

// HTML Injection রোধ করার জন্য ইনপুট এস্কেপ ফাংশন
function escapeHtml(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email service is not configured" },
      { status: 503 },
    );
  }

  try {
    // ২. নিরাপত্তা দেয়াল: সুপাবেস দিয়ে ইউজার লগইন করা আছে কি না যাচাই (Auth Check)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Missing configuration keys" }, { status: 500 });
    }

    const cookieStore = cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Next.js Route Handlers-এ কুকি সেট করার এজ-কেস হ্যান্ডলিং
          }
        },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // ইউজার লগইন না থাকলে সরাসরি অ্যাক্সেস ডিনাইড (Unauthorized)
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access detected" }, { status: 401 });
    }

    // ৩. জেড (Zod) দিয়ে ইনপুট পার্স ও ভ্যালিডেশন
    const jsonBody = await request.json();
    const parsedBody = notifySchema.safeParse(jsonBody);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid data format provided", details: parsedBody.error.format() },
        { status: 400 }
      );
    }

    const { clientEmail, folderName, fileCount } = parsedBody.data;

    // ৪. HTML Injection থেকে বাঁচতে ডেটা স্যানিটাইজ করা
    const safeEmail = escapeHtml(clientEmail);
    const safeFolder = folderName ? "/" + escapeHtml(folderName) : "Root Directory";
    const safeFileCount = escapeHtml(fileCount);

    const resend = new Resend(apiKey);

    // ৫. ইমেইলে লোকালহোস্টের বদলে লাইভ প্রোডাকশন ডোমেন ব্যবহার
    const { data, error } = await resend.emails.send({
      from: "Client Vault <onboarding@resend.dev>",
      to: ["kachnamedia@gmail.com"],
      subject: "🚨 New Assets Uploaded to Vault",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #111; color: #fff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #d4af37; margin-bottom: 20px;">New Assets Received</h2>
            <p style="font-size: 14px; margin: 8px 0;"><strong>Client:</strong> ${safeEmail}</p>
            <p style="font-size: 14px; margin: 8px 0;"><strong>Directory:</strong> ${safeFolder}</p>
            <p style="font-size: 14px; margin: 8px 0;"><strong>Files Transferred:</strong> ${safeFileCount}</p>
            <br/>
            <a href="https://www.kachnamedia.com/admin" style="background-color:#d4af37;color:black;padding:12px 24px;text-decoration:none;font-weight:bold;text-transform:uppercase;display:inline-block;border-radius:4px;">Access Kachna HQ</a>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ message: "Email sent successfully", data });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error occurred" },
      { status: 500 },
    );
  }
}