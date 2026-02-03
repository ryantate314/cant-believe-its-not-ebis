import { getMsalInstance } from "@/components/providers/msal-provider";
import { loginRequest } from "@/lib/msal-config";

/**
 * Acquires an access token silently, falling back to redirect if needed
 */
async function getAccessToken(): Promise<string | null> {
  const msalInstance = getMsalInstance();
  const account = msalInstance.getActiveAccount();
  if (!account) {
    return null;
  }

  try {
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });
    return response.accessToken;
  } catch (error) {
    console.error("Silent token acquisition failed:", error);
    // Trigger interactive login
    await msalInstance.acquireTokenRedirect(loginRequest);
    return null;
  }
}

/**
 * Wrapper around fetch that automatically attaches the access token
 */
export async function authFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const token = await getAccessToken();

  const headers: HeadersInit = {
    ...options?.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Get the current user's email from the active account
 */
export function getCurrentUserEmail(): string | null {
  const msalInstance = getMsalInstance();
  const account = msalInstance.getActiveAccount();
  return account?.username || null;
}
