"use client";

import Link from "next/link";
import Image from "next/image";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="bg-primary text-primary-foreground">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left side - Logo and site name */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/Cirrus-Horizontal-White.svg"
            alt="Cirrus Logo"
            width={120}
            height={28}
            priority
          />
          <span className="hidden text-sm font-medium sm:inline">
            Maintenance Operations
          </span>
        </Link>

        {/* Right side - User avatar and settings */}
        <div className="flex items-center gap-2">
          {/* User avatar */}
          <div className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            RT
          </div>

          {/* Settings button */}
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/settings">
              <Settings className="size-5" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
