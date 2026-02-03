"use client";

import { LayoutDashboard, ClipboardList } from "lucide-react";
import { AppSidebar, type NavItem } from "@/components/features/app-sidebar";

const userNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Work Orders",
    href: "/workorder",
    icon: ClipboardList,
  },
];

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppSidebar navItems={userNavItems} />
      <main className="flex-1 p-4">{children}</main>
    </>
  );
}
