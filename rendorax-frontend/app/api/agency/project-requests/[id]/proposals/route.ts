import { NextResponse } from "next/server";
import { proxyAgencyRequest } from "@/utils/agencyBackend";

export async function GET(
  _request: Request,
  context: { params: { id: string } },
) {
  try {
    const id = String(context.params?.id ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const upstream = await proxyAgencyRequest(
      `/project-requests/${encodeURIComponent(id)}/proposals`,
      { method: "GET" },
    );
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency proposals list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
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
      `/project-requests/${encodeURIComponent(id)}/proposals`,
      { method: "POST", body: JSON.stringify(body) },
    );
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency proposal create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
