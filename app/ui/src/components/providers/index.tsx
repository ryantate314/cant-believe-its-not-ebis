"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { MsalProvider } from "./msal-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MsalProvider>
      <SidebarProvider>{children}</SidebarProvider>
    </MsalProvider>
  );
}
