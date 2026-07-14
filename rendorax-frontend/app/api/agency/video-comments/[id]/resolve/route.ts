import { NextResponse } from "next/server";
import { proxyAgencyRequest } from "@/utils/agencyBackend";

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

async function resolveId(params: RouteContext["params"]): Promise<string> {
  const resolved = await Promise.resolve(params);
  return String(resolved.id ?? "").trim();
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const id = await resolveId(context.params);
    if (!id) {
      return NextResponse.json({ error: "comment id is required" }, { status: 400 });
    }

    const body = await request.json();
    const upstream = await proxyAgencyRequest(`/video-comments/${encodeURIComponent(id)}/resolve`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });

    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency video comment resolve error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
