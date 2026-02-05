import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const activeOnly = searchParams.get("active_only") ?? "true";

  const response = await fetch(
    `${API_URL}/api/v1/cities?active_only=${activeOnly}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
