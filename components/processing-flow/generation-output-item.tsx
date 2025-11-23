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
        "border rounded-lg transition-all duration-700 ease-in-out",
        isLocked
          ? "bg-muted/10 border-muted/30 opacity-30 scale-100"
          : isActive
            ? "bg-primary/5 border-primary shadow-md scale-[1.02]"
            : "bg-muted/20 border-muted/40 opacity-40 scale-100"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "rounded-full p-2.5 transition-all duration-500",
              isLocked
                ? "bg-muted/30"
                : isActive
                  ? "bg-primary/10 ring-2 ring-primary/20"
                  : "bg-muted/50"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 transition-all duration-500",
                isLocked
                  ? "text-muted-foreground/40"
                  : isActive
                    ? "text-primary"
                    : "text-muted-foreground/60"
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4
                className={cn(
                  "font-semibold text-sm transition-all duration-500",
                  isLocked
                    ? "text-foreground/40"
                    : isActive
                      ? "text-primary"
                      : "text-foreground/60"
                )}
              >
                {name}
              </h4>
              {!isLocked && (
                <Loader2
                  className={cn(
                    "h-4 w-4 animate-spin transition-all duration-500",
                    isActive
                      ? "text-primary opacity-100"
                      : "text-muted-foreground/40 opacity-50"
                  )}
                />
              )}
            </div>
            <p
              className={cn(
                "text-sm transition-all duration-500",
                isLocked
                  ? "text-muted-foreground/40 opacity-50"
                  : isActive
                    ? "text-muted-foreground opacity-100"
                    : "text-muted-foreground/50 opacity-60"
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
