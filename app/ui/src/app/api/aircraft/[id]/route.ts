import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const response = await fetch(`${API_URL}/api/v1/aircraft/${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404) {
    return NextResponse.json(
      { detail: "Aircraft not found" },
      { status: 404 }
    );
  }

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const response = await fetch(`${API_URL}/api/v1/aircraft/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (response.status === 404) {
    return NextResponse.json(
      { detail: "Aircraft not found" },
      { status: 404 }
    );
  }

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const response = await fetch(`${API_URL}/api/v1/aircraft/${id}`, {
    method: "DELETE",
  });

  if (response.status === 404) {
    return NextResponse.json(
      { detail: "Aircraft not found" },
      { status: 404 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
