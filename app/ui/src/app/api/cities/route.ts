import { NextRequest, NextResponse } from "next/server";
import { API_URL, getProxyHeaders } from "../_lib/proxy";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const activeOnly = searchParams.get("active_only") ?? "true";

  const response = await fetch(
    `${API_URL}/api/v1/cities?active_only=${activeOnly}`,
    {
      headers: getProxyHeaders(request),
    }
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
