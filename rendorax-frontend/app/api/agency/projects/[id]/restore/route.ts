import { NextResponse } from "next/server";
import { proxyAgencyRequest } from "@/utils/agencyBackend";

export async function PATCH(
  _request: Request,
  context: { params: { id: string } },
) {
  try {
    const projectId = String(context.params?.id ?? "").trim();
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const upstream = await proxyAgencyRequest(
      `/projects/${encodeURIComponent(projectId)}/restore`,
      { method: "PATCH" },
    );
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency project restore error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
