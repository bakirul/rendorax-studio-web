import { NextResponse } from "next/server";
import { proxyAgencyRequest } from "@/utils/agencyBackend";

export async function GET() {
  try {
    const upstream = await proxyAgencyRequest("/users", { method: "GET" });
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency users fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const upstream = await proxyAgencyRequest("/users", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency user create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
