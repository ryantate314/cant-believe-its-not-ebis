import { NextRequest, NextResponse } from "next/server";
import { API_URL, getProxyHeaders } from "../_lib/proxy";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const response = await fetch(
    `${API_URL}/api/v1/labor-kits?${searchParams.toString()}`,
    {
      headers: getProxyHeaders(request),
    }
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const response = await fetch(`${API_URL}/api/v1/labor-kits`, {
    method: "POST",
    headers: getProxyHeaders(request),
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
