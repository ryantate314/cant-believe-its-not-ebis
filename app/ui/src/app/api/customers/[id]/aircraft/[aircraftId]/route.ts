import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:8000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; aircraftId: string }> }
) {
  const { id, aircraftId } = await params;
  const createdBy = request.nextUrl.searchParams.get("created_by") || "system";

  const response = await fetch(
    `${API_URL}/api/v1/customers/${id}/aircraft/${aircraftId}?created_by=${encodeURIComponent(createdBy)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; aircraftId: string }> }
) {
  const { id, aircraftId } = await params;

  const response = await fetch(
    `${API_URL}/api/v1/customers/${id}/aircraft/${aircraftId}`,
    {
      method: "DELETE",
    }
  );

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
