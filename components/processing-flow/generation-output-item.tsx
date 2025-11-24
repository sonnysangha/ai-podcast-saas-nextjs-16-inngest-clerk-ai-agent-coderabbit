"use client";

import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerationOutputItemProps {
  name: string;
  description: string;
  icon: LucideIcon;
  isActive: boolean;
  isLocked?: boolean;
}

export function GenerationOutputItem({
  name,
  description,
  icon: Icon,
  isActive,
  isLocked = false,
}: GenerationOutputItemProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-xl transition-all duration-700 ease-in-out",
        isLocked
          ? "opacity-30 scale-100"
          : isActive
            ? "ring-2 ring-emerald-400 shadow-lg scale-[1.02]"
            : "opacity-40 scale-100"
      )}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "rounded-xl p-3 transition-all duration-500",
              isLocked
                ? "bg-gray-200"
                : isActive
                  ? "gradient-emerald shadow-md"
                  : "bg-emerald-100"
            )}
          >
            <Icon
              className={cn(
                "h-6 w-6 transition-all duration-500",
                isLocked
                  ? "text-gray-400"
                  : isActive
                    ? "text-white"
                    : "text-emerald-600"
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h4
                className={cn(
                  "font-bold text-base transition-all duration-500",
                  isLocked
                    ? "text-gray-400"
                    : isActive
                      ? "text-emerald-700"
                      : "text-gray-600"
                )}
              >
                {name}
              </h4>
              {!isLocked && (
                <Loader2
                  className={cn(
                    "h-5 w-5 animate-spin transition-all duration-500",
                    isActive
                      ? "text-emerald-600 opacity-100"
                      : "text-gray-400 opacity-50"
                  )}
                />
              )}
            </div>
            <p
              className={cn(
                "text-sm transition-all duration-500",
                isLocked
                  ? "text-gray-400 opacity-50"
                  : isActive
                    ? "text-gray-700 opacity-100"
                    : "text-gray-500 opacity-60"
              )}
            >
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
