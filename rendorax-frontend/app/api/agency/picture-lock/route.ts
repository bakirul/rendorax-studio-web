import { NextResponse } from "next/server";
import { proxyAgencyRequest } from "@/utils/agencyBackend";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaAssetId = searchParams.get("mediaAssetId")?.trim();
    if (!mediaAssetId) {
      return NextResponse.json(
        { error: "mediaAssetId query parameter is required" },
        { status: 400 },
      );
    }

    const upstream = await proxyAgencyRequest(
      `/picture-lock?mediaAssetId=${encodeURIComponent(mediaAssetId)}`,
      { method: "GET" },
    );
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency picture lock fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const upstream = await proxyAgencyRequest("/picture-lock", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency picture lock create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
