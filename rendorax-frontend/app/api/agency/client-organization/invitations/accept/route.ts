import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") ?? "";
    const upstream = await fetch(
      `${BACKEND_URL}/api/agency/client-organization/invitations/accept?token=${encodeURIComponent(token)}`,
      { method: "GET", cache: "no-store" },
    );
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Validate invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const upstream = await fetch(
      `${BACKEND_URL}/api/agency/client-organization/invitations/accept`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
