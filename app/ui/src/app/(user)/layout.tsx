"use client";

import { LayoutDashboard, ClipboardList, Plane, Wrench } from "lucide-react";
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
  {
    label: "Aircraft",
    href: "/aircraft",
    icon: Plane,
  },
  {
    label: "Tools",
    href: "/tool",
    icon: Wrench,
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
