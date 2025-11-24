/**
 * Centralized status utilities for project status
 */

import {
  CheckCircle2,
  Clock,
  Loader2,
  type LucideIcon,
  XCircle,
} from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

export type ProjectStatus = Doc<"projects">["status"];
export type JobStatus = Doc<"projects">["jobStatus"];

export function getStatusVariant(
  status: ProjectStatus
): "default" | "secondary" | "destructive" {
  switch (status) {
    case "uploaded":
      return "default";
    case "processing":
      return "secondary";
    case "completed":
      return "default";
    case "failed":
      return "destructive";
  }
}

export function getStatusIcon(status: ProjectStatus): LucideIcon {
  switch (status) {
    case "uploaded":
      return Clock;
    case "processing":
      return Loader2;
    case "completed":
      return CheckCircle2;
    case "failed":
      return XCircle;
  }
}
