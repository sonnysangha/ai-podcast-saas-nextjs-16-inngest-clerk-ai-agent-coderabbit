"use client";

import { FolderOpen, Upload } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DashboardNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/dashboard/projects") {
      return pathname === path || pathname.startsWith("/dashboard/projects/");
    }
    return pathname === path;
  };

  return (
    <nav className="flex items-center gap-2">
      <Link href="/dashboard/projects">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2 transition-all duration-300 font-medium",
            isActive("/dashboard/projects")
              ? "bg-white/95 text-emerald-600 hover:bg-white hover:scale-105 shadow-lg border border-white/20"
              : "text-white hover:bg-white/20 hover:scale-105",
          )}
        >
          <FolderOpen className="h-4 w-4" />
          <span className="hidden lg:inline">Projects</span>
        </Button>
      </Link>
      <Link href="/dashboard/upload">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2 transition-all duration-300 font-medium",
            isActive("/dashboard/upload")
              ? "bg-white/95 text-emerald-600 hover:bg-white hover:scale-105 shadow-lg border border-white/20"
              : "text-white hover:bg-white/20 hover:scale-105",
          )}
        >
          <Upload className="h-4 w-4" />
          <span className="hidden lg:inline">Upload</span>
        </Button>
      </Link>
    </nav>
  );
}
