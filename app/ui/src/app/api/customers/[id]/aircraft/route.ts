import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const response = await fetch(`${API_URL}/api/v1/customers/${id}/aircraft`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
