"use client";

import { ErrorRetryCard } from "@/components/project-detail/error-retry-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Id } from "@/convex/_generated/dataModel";

interface SummaryTabProps {
  projectId: Id<"projects">;
  summary?: {
    tldr: string;
    full: string;
    bullets: string[];
    insights: string[];
  };
  error?: string;
}

export function SummaryTab({ projectId, summary, error }: SummaryTabProps) {
  if (error) {
    return (
      <ErrorRetryCard
        projectId={projectId}
        job="summary"
        errorMessage={error}
      />
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No summary available
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>TL;DR</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{summary.tldr}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Full Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{summary.full}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Points</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {summary.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {summary.insights.map((insight) => (
              <li key={insight} className="flex items-start gap-2">
                <span className="text-primary mt-1">💡</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
