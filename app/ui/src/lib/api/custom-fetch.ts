/**
 * Custom fetch mutator for Orval-generated API client.
 * Handles API requests through Next.js proxy and provides consistent error handling.
 *
 * Since this throws on errors, the return type excludes error response variants.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Extracts the success response type from Orval's union types.
 * Orval generates: `type Response = { data: Success; status: 200 } | { data: Error; status: 422 }`
 * This extracts only the success variant based on status code.
 */
type SuccessResponse<T> = Extract<T, { status: 200 | 201 | 204 }>;

/**
 * Custom fetch implementation compatible with Orval's generated code.
 * Orval calls: customFetch<T>(url, { method, headers, body, signal, ... })
 *
 * Returns only success responses - errors throw ApiError instead of returning.
 */
export const customFetch = async <T>(
  url: string,
  options?: RequestInit
): Promise<SuccessResponse<T>> => {
  // Transform /api/v1/* paths to /api/* for Next.js proxy
  const transformedUrl = url.replace(/^\/api\/v1/, "/api");

  const response = await fetch(transformedUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.detail || `API error: ${response.status}`,
      errorData
    );
  }

  // Return response wrapper matching Orval's expected structure
  // Cast through unknown since we've validated the response is successful
  if (response.status === 204) {
    return {
      data: undefined,
      status: response.status,
      headers: response.headers,
    } as unknown as SuccessResponse<T>;
  }

  const data = await response.json();
  return {
    data,
    status: response.status,
    headers: response.headers,
  } as unknown as SuccessResponse<T>;
};

export default customFetch;
