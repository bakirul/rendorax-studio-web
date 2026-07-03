import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { CONTACT_EMAIL } from "@/utils/contactEmail";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  format: z.string().optional(),
  message: z.string().min(1, "Message is required"),
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  try {
    const jsonBody = await request.json();
    const parsed = contactSchema.safeParse(jsonBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid contact form data" },
        { status: 400 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 503 },
      );
    }

    const { name, email, format, message } = parsed.data;
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeFormat = escapeHtml(format ?? "Not specified");
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Rendorax Contact <onboarding@resend.dev>",
      to: [CONTACT_EMAIL],
      replyTo: email,
      subject: `New Project Brief: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #111; color: #fff; padding: 24px; border-radius: 8px;">
          <h2 style="color: #d4af37; margin-bottom: 16px;">New Contact Form Submission</h2>
          <p style="font-size: 14px; margin: 8px 0;"><strong>Client / Brand:</strong> ${safeName}</p>
          <p style="font-size: 14px; margin: 8px 0;"><strong>Email:</strong> ${safeEmail}</p>
          <p style="font-size: 14px; margin: 8px 0;"><strong>Project Format:</strong> ${safeFormat}</p>
          <p style="font-size: 14px; margin: 16px 0 8px;"><strong>Brief:</strong></p>
          <p style="font-size: 14px; line-height: 1.6; color: #ccc;">${safeMessage}</p>
        </div>
      `,
    });

    if (error) {
      console.error("Contact form email error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
