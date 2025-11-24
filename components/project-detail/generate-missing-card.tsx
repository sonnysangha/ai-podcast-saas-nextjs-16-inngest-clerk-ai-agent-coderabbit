"use client";

import { generateMissingFeatures } from "@/app/actions/generate-missing-features";
import { Button } from "@/components/ui/button";
import type { Id } from "@/convex/_generated/dataModel";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface GenerateMissingCardProps {
  projectId: Id<"projects">;
  message?: string;
  className?: string;
}

export function GenerateMissingCard({
  projectId,
  message,
  className = "",
}: GenerateMissingCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateMissingFeatures(projectId);
      toast.success(result.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate features",
      );
      setIsGenerating(false);
    }
  };

  return (
    <div
      className={`glass-card rounded-2xl p-12 text-center space-y-6 ${className}`}
    >
      <p className="text-gray-600 text-lg">
        {message || "No content available"}
      </p>
      <p className="text-sm text-gray-500">
        It looks like this project was processed before you upgraded.
      </p>
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="gradient-emerald text-white hover-glow shadow-lg px-6 py-3 gap-2"
      >
        <Sparkles className="h-5 w-5" />
        {isGenerating ? "Generating..." : "Generate All Missing Features"}
      </Button>
      <p className="text-xs text-gray-500">
        This will generate all features available in your current plan
      </p>
    </div>
  );
}
