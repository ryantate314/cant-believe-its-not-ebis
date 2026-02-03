import { NextRequest, NextResponse } from "next/server";
import { API_URL, getProxyHeaders } from "../../../../_lib/proxy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; workOrderId: string }> }
) {
  const { id, workOrderId } = await params;

  const response = await fetch(
    `${API_URL}/api/v1/labor-kits/${id}/apply/${workOrderId}`,
    {
      method: "POST",
      headers: getProxyHeaders(request),
    }
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
