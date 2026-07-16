import { NextResponse } from "next/server";
import { proxyAgencyRequest } from "@/utils/agencyBackend";

export async function PATCH(
  _request: Request,
  context: { params: { id: string } },
) {
  try {
    const id = String(context.params?.id ?? "").trim();
    const upstream = await proxyAgencyRequest(
      `/client-organization/invitations/${encodeURIComponent(id)}/revoke`,
      { method: "PATCH", body: JSON.stringify({}) },
    );
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Revoke invitation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
