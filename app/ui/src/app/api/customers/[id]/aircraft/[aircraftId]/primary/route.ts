import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:8000";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; aircraftId: string }> }
) {
  const { id, aircraftId } = await params;

  const response = await fetch(
    `${API_URL}/api/v1/customers/${id}/aircraft/${aircraftId}/primary`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
