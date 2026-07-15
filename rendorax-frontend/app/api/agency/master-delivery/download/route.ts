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
      `/master-delivery/download?mediaAssetId=${encodeURIComponent(mediaAssetId)}`,
      { method: "GET" },
    );
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency master delivery download error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
