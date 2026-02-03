import { NextRequest, NextResponse } from "next/server";
import { API_URL, getProxyHeaders } from "../../../_lib/proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();

  const response = await fetch(
    `${API_URL}/api/v1/work-orders/${id}/items${queryString ? `?${queryString}` : ""}`,
    {
      headers: getProxyHeaders(request),
    }
  );

  if (response.status === 404) {
    return NextResponse.json(
      { detail: "Work order not found" },
      { status: 404 }
    );
  }

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const response = await fetch(`${API_URL}/api/v1/work-orders/${id}/items`, {
    method: "POST",
    headers: getProxyHeaders(request),
    body: JSON.stringify(body),
  });

  if (response.status === 404) {
    return NextResponse.json(
      { detail: "Work order not found" },
      { status: 404 }
    );
  }

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
