import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:8000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; workOrderId: string }> }
) {
  const { id, workOrderId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const createdBy = searchParams.get("created_by");

  if (!createdBy) {
    return NextResponse.json(
      { detail: "created_by parameter is required" },
      { status: 400 }
    );
  }

  const response = await fetch(
    `${API_URL}/api/v1/labor-kits/${id}/apply/${workOrderId}?created_by=${encodeURIComponent(createdBy)}`,
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
