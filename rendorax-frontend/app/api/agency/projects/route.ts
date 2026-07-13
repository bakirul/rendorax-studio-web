import { NextResponse } from "next/server";
import { proxyAgencyRequest } from "@/utils/agencyBackend";

export async function GET() {
  try {
    const upstream = await proxyAgencyRequest("/projects", { method: "GET" });
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency projects fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const upstream = await proxyAgencyRequest("/projects", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency project create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { projectId, status } = await request.json();
    if (typeof projectId !== "string" || !projectId.trim()) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    if (typeof status !== "string" || !status.trim()) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const upstream = await proxyAgencyRequest(`/projects/${projectId.trim()}`, {
      method: "PATCH",
      body: JSON.stringify({ status: status.trim() }),
    });

    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency project update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
