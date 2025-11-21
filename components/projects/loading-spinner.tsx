"use client";

import { Loader2 } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div className="container max-w-6xl mx-auto py-10 px-4">
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}



