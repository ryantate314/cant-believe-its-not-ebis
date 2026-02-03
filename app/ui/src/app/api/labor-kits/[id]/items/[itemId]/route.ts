import { NextRequest, NextResponse } from "next/server";
import { API_URL, getProxyHeaders } from "../../../../_lib/proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;

  const response = await fetch(
    `${API_URL}/api/v1/labor-kits/${id}/items/${itemId}`,
    {
      headers: getProxyHeaders(request),
    }
  );

  if (response.status === 404) {
    return NextResponse.json({ detail: "Item not found" }, { status: 404 });
  }

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  const body = await request.json();

  const response = await fetch(
    `${API_URL}/api/v1/labor-kits/${id}/items/${itemId}`,
    {
      method: "PUT",
      headers: getProxyHeaders(request),
      body: JSON.stringify(body),
    }
  );

  if (response.status === 404) {
    return NextResponse.json({ detail: "Item not found" }, { status: 404 });
  }

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;

  const response = await fetch(
    `${API_URL}/api/v1/labor-kits/${id}/items/${itemId}`,
    {
      method: "DELETE",
      headers: getProxyHeaders(request),
    }
  );

  if (response.status === 404) {
    return NextResponse.json({ detail: "Item not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
