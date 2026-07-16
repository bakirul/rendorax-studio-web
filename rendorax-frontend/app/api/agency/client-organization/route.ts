import { NextResponse } from "next/server";
import { Resend } from "resend";
import { proxyAgencyRequest } from "@/utils/agencyBackend";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.toString();
    const path = query
      ? `/client-organization?${query}`
      : "/client-organization";
    const upstream = await proxyAgencyRequest(path, { method: "GET" });
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Client organization fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
