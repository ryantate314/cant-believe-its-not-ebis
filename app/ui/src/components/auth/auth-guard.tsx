"use client";

import {
  useIsAuthenticated,
  useMsal,
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useEffect } from "react";
import { loginRequest } from "@/lib/msal-config";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    // Only trigger redirect when MSAL is idle and user is not authenticated
    if (inProgress === InteractionStatus.None && !isAuthenticated) {
      instance.loginRedirect(loginRequest);
    }
  }, [inProgress, isAuthenticated, instance]);

  // Show loading during any MSAL interaction
  if (inProgress !== InteractionStatus.None) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Authenticating...</div>
      </div>
    );
  }

  return (
    <>
      <AuthenticatedTemplate>{children}</AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-muted-foreground">Redirecting to login...</div>
        </div>
      </UnauthenticatedTemplate>
    </>
  );
}
