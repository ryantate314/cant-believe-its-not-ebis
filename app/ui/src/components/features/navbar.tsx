"use client";

import Link from "next/link";
import Image from "next/image";
import { Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

export function Navbar() {
  const { user, signOut } = useAuth();

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
          {/* User avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-primary">
                {user?.initials || "?"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings button */}
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/admin">
              <Settings className="size-5" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
