import { NextResponse } from "next/server";
import { proxyAgencyRequest } from "@/utils/agencyBackend";

export async function PATCH(
  request: Request,
  context: { params: { id: string } },
) {
  try {
    const id = String(context.params?.id ?? "").trim();
    const body = await request.json();
    const upstream = await proxyAgencyRequest(
      `/client-organization/members/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify(body) },
    );
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: { id: string } },
) {
  try {
    const id = String(context.params?.id ?? "").trim();
    const upstream = await proxyAgencyRequest(
      `/client-organization/members/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
