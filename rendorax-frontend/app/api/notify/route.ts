import { NextResponse } from "next/server";
import { Resend } from "resend";
import { CONTACT_EMAIL } from "@/utils/contactEmail";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

// ফাইল আপলোডের ইনপুট ডেটা ভ্যালিডেশন
const uploadSchema = z.object({
  folderName: z.string().nullable().optional(),
  fileCount: z.union([z.string(), z.number()]),
});

// সম্পূর্ণ রিভিউ সেশনের সামারি ভ্যালিডেশন
const reviewSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  totalComments: z.number(),
  compiledNotes: z.string().max(100_000).optional(),
});

/** Discord embed field value limit is 1024; leave room for truncation notice. */
const DISCORD_NOTES_FIELD_LIMIT = 1000;

// HTML Injection / XSS Protection Utility
function escapeHtml(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function truncateForDiscord(text: string, maxLen = DISCORD_NOTES_FIELD_LIMIT): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 48)}\n…(truncated — open Rendorax HQ for full list)`;
}

function buildCompiledNotesEmailSection(compiledNotes: string | undefined): string {
  if (!compiledNotes?.trim()) return "";
  const safeNotes = escapeHtml(compiledNotes);
  return `
                  <h3 style="color: #d4af37; margin: 24px 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Feedback Notes</h3>
                  <pre style="font-family: Consolas, Monaco, monospace; font-size: 12px; line-height: 1.5; background-color: #0a0a0f; border: 1px solid #333; border-radius: 6px; padding: 16px; white-space: pre-wrap; word-wrap: break-word; color: #e5e5e5; margin: 0 0 20px;">${safeNotes}</pre>`;
}

function buildDiscordNotesField(compiledNotes: string | undefined) {
  if (!compiledNotes?.trim()) return null;
  return {
    name: "📝 Compiled Notes",
    value: truncateForDiscord(compiledNotes),
    inline: false,
  };
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Missing configuration keys" }, { status: 500 });
    }

    const cookieStore = cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    });

    // 🔒 ১. কঠোর সার্ভার-সাইড অথেন্টিকেশন চেক (সরাসরি সুপাবেস কোর থেকে)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || !user.email) {
      return NextResponse.json({ error: "Unauthorized access detected" }, { status: 401 });
    }

    const jsonBody = await request.json();
    
    // চেক করা হচ্ছে এটি রিভিউ কমপ্লিট নোটিফিকেশন কি না
    const isReviewComplete = "totalComments" in jsonBody;

    // ক্লায়েন্টের আসল ইমেইলটি সরাসরি সুপাবেস সেশন থেকে নিচ্ছি (Email Spoofing প্রটেকশন)
    const safeUserEmail = escapeHtml(user.email);

    if (isReviewComplete) {
      // ==========================================
      //  A. সম্পূর্ণ রিভিউ সেশনের সামারি নোটিফিকেশন
      // ==========================================
      const parsedBody = reviewSchema.safeParse(jsonBody);
      if (!parsedBody.success) {
        return NextResponse.json({ error: "Invalid review data format" }, { status: 400 });
      }

      const { fileName, totalComments, compiledNotes } = parsedBody.data;
      const safeFileName = escapeHtml(fileName);
      const discordNotesField = buildDiscordNotesField(compiledNotes);
      const discordFields = [
        { name: "📊 Total Notes/Comments", value: `\`${totalComments} Comments\``, inline: true },
        { name: "👤 Reviewed By", value: safeUserEmail, inline: true },
        ...(discordNotesField ? [discordNotesField] : []),
      ];

      // ১. ডিসকোর্ড সামারি অ্যালার্ট
      const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
      if (DISCORD_WEBHOOK_URL) {
        try {
          await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: `🔥 **Rendorax Vault: Review Session Completed!**`,
              embeds: [
                {
                  title: `🎬 Project: ${safeFileName}`,
                  description: discordNotesField
                    ? `The client has finished reviewing this asset and submitted feedback notes (see compiled notes below).`
                    : `The client has finished reviewing this asset and submitted all feedback notes.`,
                  color: 13936439, // Rendorax Gold
                  fields: discordFields,
                  timestamp: new Date().toISOString(),
                },
              ],
            }),
          });
        } catch (err) { console.error("Discord error:", err); }
      }

      // ২. রেসেন্ড ইমেইল সামারি অ্যালার্ট
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        try {
          const resend = new Resend(apiKey);
          await resend.emails.send({
            from: "Client Vault <onboarding@resend.dev>",
            to: [CONTACT_EMAIL],
            subject: `🎬 Review Completed for ${safeFileName}`,
            html: `
              <div style="font-family: Arial, sans-serif; background-color: #111; color: #fff; padding: 20px; border-radius: 8px;">
                  <h2 style="color: #d4af37; margin-bottom: 20px;">Review Session Complete</h2>
                  <p style="font-size: 14px; margin: 8px 0;"><strong>Asset File:</strong> ${safeFileName}</p>
                  <p style="font-size: 14px; margin: 8px 0;"><strong>Total Feedback Left:</strong> <span style="color: #d4af37; font-weight: bold;">${totalComments} comments</span></p>
                  <p style="font-size: 14px; margin: 8px 0;"><strong>Client Email:</strong> ${safeUserEmail}</p>
                  ${buildCompiledNotesEmailSection(compiledNotes)}
                  <a href="https://www.rendorax.com/admin" style="background-color:#d4af37;color:black;padding:12px 24px;text-decoration:none;font-weight:bold;text-transform:uppercase;display:inline-block;border-radius:4px;">Open Rendorax HQ to View Notes</a>
              </div>
            `,
          });
        } catch (err) { console.error("Email error:", err); }
      }

      return NextResponse.json({ success: true, message: "Review summary notification sent" });

    } else {
      // ==========================================
      //  B. ফাইল আপলোড নোটিফিকেশন
      // ==========================================
      const parsedBody = uploadSchema.safeParse(jsonBody);
      if (!parsedBody.success) {
        return NextResponse.json({ error: "Invalid upload data format" }, { status: 400 });
      }

      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
      }

      const { folderName, fileCount } = parsedBody.data;
      const safeFolder = folderName ? "/" + escapeHtml(folderName) : "Root Directory";
      const safeFileCount = escapeHtml(fileCount);

      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from: "Client Vault <onboarding@resend.dev>",
        to: [CONTACT_EMAIL],
        subject: "🚨 New Assets Uploaded to Vault",
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #111; color: #fff; padding: 20px; border-radius: 8px;">
              <h2 style="color: #d4af37; margin-bottom: 20px;">New Assets Received</h2>
              <p style="font-size: 14px; margin: 8px 0;"><strong>Client:</strong> ${safeUserEmail}</p>
              <p style="font-size: 14px; margin: 8px 0;"><strong>Directory:</strong> ${safeFolder}</p>
              <p style="font-size: 14px; margin: 8px 0;"><strong>Files Transferred:</strong> ${safeFileCount}</p>
              <br/>
              <a href="https://www.rendorax.com/admin" style="background-color:#d4af37;color:black;padding:12px 24px;text-decoration:none;font-weight:bold;text-transform:uppercase;display:inline-block;border-radius:4px;">Access Rendorax HQ</a>
          </div>
        `,
      });

      if (error) return NextResponse.json({ error }, { status: 500 });
      return NextResponse.json({ message: "Email sent successfully", data });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}