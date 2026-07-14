import { NextResponse } from "next/server";
import { proxyAgencyRequest } from "@/utils/agencyBackend";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectIds = searchParams.get("projectIds")?.trim();
    if (!projectIds) {
      return NextResponse.json(
        { error: "projectIds query parameter is required" },
        { status: 400 },
      );
    }

    const upstream = await proxyAgencyRequest(
      `/video-comments/summary?projectIds=${encodeURIComponent(projectIds)}`,
      { method: "GET" },
    );
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency video comments summary error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
