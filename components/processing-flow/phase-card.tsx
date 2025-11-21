"use client";

import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { PhaseStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PhaseCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: PhaseStatus;
  isActive: boolean;
  progress?: number;
  timeEstimate?: string;
  children?: React.ReactNode;
}

export function PhaseCard({
  icon,
  title,
  description,
  status,
  isActive,
  progress,
  timeEstimate,
  children,
}: PhaseCardProps) {
  const isRunning = status === "running";
  const isCompleted = status === "completed";

  return (
    <Card
      className={cn(
        "border-2 transition-all",
        isActive && "border-primary shadow-lg",
        isCompleted && "border-green-500",
        !isCompleted && !isActive && "opacity-50",
      )}
    >
      <CardContent className="pt-6 pb-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">{icon}</div>
              <div>
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>

            <div>
              {isRunning && (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              )}
              {isCompleted && (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              )}
            </div>
          </div>

          {isRunning && progress !== undefined && (
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                {timeEstimate && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Estimated: {timeEstimate}</span>
                  </div>
                )}
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          )}

          {!isRunning && timeEstimate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Estimated: {timeEstimate}</span>
            </div>
          )}

          {children}
        </div>
      </CardContent>
    </Card>
  );
}
