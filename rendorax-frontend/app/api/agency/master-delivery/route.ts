import { NextResponse } from "next/server";
import { proxyAgencyRequest } from "@/utils/agencyBackend";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyProjectId = searchParams.get("agencyProjectId")?.trim();
    if (!agencyProjectId) {
      return NextResponse.json(
        { error: "agencyProjectId query parameter is required" },
        { status: 400 },
      );
    }

    const upstream = await proxyAgencyRequest(
      `/master-delivery?agencyProjectId=${encodeURIComponent(agencyProjectId)}`,
      { method: "GET" },
    );
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency master delivery fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const upstream = await proxyAgencyRequest("/master-delivery", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency master delivery create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
