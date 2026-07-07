import { NextResponse } from "next/server";
import { proxyAgencyRequest } from "@/utils/agencyBackend";

export async function GET() {
  try {
    const upstream = await proxyAgencyRequest("/me", { method: "GET" });
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency user sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
