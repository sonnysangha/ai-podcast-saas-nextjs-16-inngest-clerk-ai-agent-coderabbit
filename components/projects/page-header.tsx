"use client";

import { Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PageHeader() {
  return (
    <div className="mb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
            My <span className="gradient-emerald-text">Projects</span>
          </h1>
          <p className="text-lg text-gray-600">
            Manage and view all your podcast projects
          </p>
        </div>
        <Link href="/dashboard/upload">
          <Button className="gradient-emerald text-white hover-glow shadow-lg px-6 py-6 text-base">
            <Upload className="mr-2 h-5 w-5" />
            New Upload
          </Button>
        </Link>
      </div>
    </div>
  );
}
