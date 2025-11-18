"use client";

import { Button } from "@/components/ui/button";
import { FolderOpen, Upload } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashboardNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/dashboard/projects") {
      return pathname === path || pathname.startsWith("/dashboard/projects/");
    }
    return pathname === path;
  };

  return (
    <nav className="hidden md:flex items-center gap-2">
      <Link href="/dashboard/projects">
        <Button
          variant={isActive("/dashboard/projects") ? "default" : "ghost"}
          size="sm"
          className="gap-2"
        >
          <FolderOpen className="h-4 w-4" />
          Projects
        </Button>
      </Link>
      <Link href="/dashboard/upload">
        <Button
          variant={isActive("/dashboard/upload") ? "default" : "ghost"}
          size="sm"
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </Link>
    </nav>
  );
}
