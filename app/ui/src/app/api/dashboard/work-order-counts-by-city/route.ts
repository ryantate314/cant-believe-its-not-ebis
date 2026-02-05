import { NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:8000";

export async function GET() {
  const response = await fetch(
    `${API_URL}/api/v1/dashboard/work-order-counts-by-city`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
