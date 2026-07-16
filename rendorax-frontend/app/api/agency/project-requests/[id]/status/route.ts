import { NextResponse } from "next/server";
import { proxyAgencyRequest } from "@/utils/agencyBackend";

export async function PATCH(
  request: Request,
  context: { params: { id: string } },
) {
  try {
    const id = String(context.params?.id ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const body = await request.json();
    const upstream = await proxyAgencyRequest(
      `/project-requests/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    );
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency project request status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
