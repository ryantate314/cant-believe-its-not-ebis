"use client";

import { Package, Settings } from "lucide-react";
import { AppSidebar, type NavItem } from "@/components/features/app-sidebar";

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
    <>
      <AppSidebar navItems={adminNavItems} />
      <main className="flex-1 p-4">{children}</main>
    </>
  );
}
