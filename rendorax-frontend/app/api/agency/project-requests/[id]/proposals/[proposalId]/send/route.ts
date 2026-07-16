import { NextResponse } from "next/server";
import { proxyAgencyRequest } from "@/utils/agencyBackend";

export async function PATCH(
  _request: Request,
  context: { params: { id: string; proposalId: string } },
) {
  try {
    const id = String(context.params?.id ?? "").trim();
    const proposalId = String(context.params?.proposalId ?? "").trim();
    if (!id || !proposalId) {
      return NextResponse.json(
        { error: "id and proposalId are required" },
        { status: 400 },
      );
    }
    const upstream = await proxyAgencyRequest(
      `/project-requests/${encodeURIComponent(id)}/proposals/${encodeURIComponent(proposalId)}/send`,
      { method: "PATCH", body: JSON.stringify({}) },
    );
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency proposal send error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
