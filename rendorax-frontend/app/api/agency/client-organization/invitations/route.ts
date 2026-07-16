import { NextResponse } from "next/server";
import { Resend } from "resend";
import { proxyAgencyRequest } from "@/utils/agencyBackend";

async function trySendInviteEmail(input: {
  to: string;
  organizationName?: string;
  inviterName?: string;
  role: string;
  inviteUrl: string;
  expiresAt?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Rendorax Studio <onboarding@resend.dev>",
      to: [input.to],
      subject: "You’ve been invited to review projects in Rendorax Studio",
      html: `
        <div style="font-family: Arial, sans-serif; background:#111; color:#fff; padding:24px;">
          <h2 style="color:#d4af37;">Rendorax Studio invitation</h2>
          <p>You've been invited to join <strong>${input.organizationName || "an organization"}</strong>
          as <strong>${input.role}</strong>${input.inviterName ? ` by ${input.inviterName}` : ""}.</p>
          <p><a href="${input.inviteUrl}" style="color:#d4af37;">Accept Invitation</a></p>
          <p style="color:#999; font-size:12px;">This link expires ${input.expiresAt ? `on ${input.expiresAt}` : "in 7 days"}.</p>
        </div>
      `,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const upstream = await proxyAgencyRequest("/client-organization/invitations", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const payload = await upstream.json().catch(() => ({}));

    if (upstream.ok && payload.inviteUrl && payload.invitation?.email) {
      const emailSent = await trySendInviteEmail({
        to: payload.invitation.email,
        organizationName: payload.organizationName,
        inviterName: payload.inviterName,
        role: payload.invitation.role,
        inviteUrl: payload.inviteUrl,
        expiresAt: payload.invitation.expiresAt,
      });
      payload.emailSent = emailSent;
      payload.emailDeliveryNote = emailSent
        ? undefined
        : "Email delivery not configured or failed. Copy the invite link below.";
    }

    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Client organization invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
