"use client";

import { useMsal, useAccount } from "@azure/msal-react";
import { useCallback } from "react";
import { loginRequest } from "@/lib/msal-config";

export interface AuthUser {
  email: string;
  name: string;
  initials: string;
}

export function useAuth() {
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!account) return null;

    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      return response.accessToken;
    } catch (error) {
      // If silent token acquisition fails, try interactive
      console.error("Silent token acquisition failed:", error);
      try {
        const response = await instance.acquireTokenRedirect(loginRequest);
        // This won't return as it redirects
        return null;
      } catch (interactiveError) {
        console.error("Interactive token acquisition failed:", interactiveError);
        return null;
      }
    }
  }, [instance, account]);

  const signOut = useCallback(async () => {
    await instance.logoutRedirect({
      postLogoutRedirectUri: "/",
    });
  }, [instance]);

  const user: AuthUser | null = account
    ? {
        email: account.username || "",
        name: account.name || account.username || "",
        initials: getInitials(account.name || account.username || ""),
      }
    : null;

  return {
    user,
    isAuthenticated: !!account,
    getAccessToken,
    signOut,
  };
}

function getInitials(name: string): string {
  if (!name) return "?";

  // If it's an email, take first letter of local part
  if (name.includes("@")) {
    const localPart = name.split("@")[0];
    return localPart.substring(0, 2).toUpperCase();
  }

  // Otherwise, take first letter of first two words
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
