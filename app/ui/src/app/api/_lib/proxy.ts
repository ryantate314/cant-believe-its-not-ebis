import { NextRequest } from "next/server";

export const API_URL = process.env.API_URL || "http://localhost:8000";

/**
 * Extracts and forwards the Authorization header from the incoming request
 */
export function getProxyHeaders(request: NextRequest): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const authorization = request.headers.get("Authorization");
  if (authorization) {
    headers["Authorization"] = authorization;
  }

  return headers;
}
