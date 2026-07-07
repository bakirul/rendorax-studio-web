import { NextResponse } from "next/server";
import { proxyAgencyRequest } from "@/utils/agencyBackend";

export async function GET() {
  try {
    const upstream = await proxyAgencyRequest("/tasks", { method: "GET" });
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency tasks fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const upstream = await proxyAgencyRequest("/tasks", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency task create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { taskId, ...body } = await request.json();
    if (typeof taskId !== "string" || !taskId.trim()) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const upstream = await proxyAgencyRequest(`/tasks/${taskId.trim()}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });

    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("Agency task update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
