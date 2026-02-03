"use client";

import { Package, Settings } from "lucide-react";
import { AppSidebar, type NavItem } from "@/components/features/app-sidebar";
import { AuthGuard } from "@/components/auth/auth-guard";

const adminNavItems: NavItem[] = [
  {
    label: "Labor Kits",
    href: "/admin/laborkit",
    icon: Package,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppSidebar navItems={adminNavItems} />
      <main className="flex-1 p-4">{children}</main>
    </AuthGuard>
  );
}
