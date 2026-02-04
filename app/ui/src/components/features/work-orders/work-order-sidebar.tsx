"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface WorkOrderSidebarProps {
  workOrderId: string;
}

const navItems = [
  { label: "Items", href: "item" },
  { label: "Configuration", href: "config" },
];

export function WorkOrderSidebar({ workOrderId }: WorkOrderSidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="w-48 border-r bg-muted/30 p-4">
      <ul className="space-y-1">
        {navItems.map((item) => {
          const href = `/workorder/${workOrderId}/${item.href}`;
          const isActive = pathname.startsWith(href);

          return (
            <li key={item.href}>
              <Link
                href={href}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
