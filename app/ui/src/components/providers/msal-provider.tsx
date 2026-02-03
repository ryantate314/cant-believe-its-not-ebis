"use client";

import { MsalProvider as MsalReactProvider } from "@azure/msal-react";
import {
  PublicClientApplication,
  EventType,
  type AuthenticationResult,
} from "@azure/msal-browser";
import { msalConfig } from "@/lib/msal-config";
import { useEffect, useState } from "react";

// Create MSAL instance outside component to prevent recreation on re-renders
let msalInstance: PublicClientApplication | null = null;

function getMsalInstance() {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
  }
  return msalInstance;
}

export function MsalProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [instance, setInstance] = useState<PublicClientApplication | null>(null);

  useEffect(() => {
    const initializeMsal = async () => {
      const pca = getMsalInstance();
      await pca.initialize();

      // Handle redirect promise after initialization
      try {
        const response = await pca.handleRedirectPromise();
        if (response) {
          pca.setActiveAccount(response.account);
        }
      } catch (error) {
        console.error("MSAL: Error handling redirect:", error);
      }

      // Set default active account if one exists
      const accounts = pca.getAllAccounts();
      if (accounts.length > 0 && !pca.getActiveAccount()) {
        pca.setActiveAccount(accounts[0]);
      }

      // Listen for sign-in events
      pca.addEventCallback((event) => {
        if (
          event.eventType === EventType.LOGIN_SUCCESS &&
          event.payload
        ) {
          const payload = event.payload as AuthenticationResult;
          pca.setActiveAccount(payload.account);
        }
      });

      setInstance(pca);
      setIsInitialized(true);
    };

    initializeMsal();
  }, []);

  if (!isInitialized || !instance) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <MsalReactProvider instance={instance}>{children}</MsalReactProvider>
  );
}

export { getMsalInstance };
