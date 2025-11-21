"use client";

import { ErrorRetryCard } from "@/components/project-detail/error-retry-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Id } from "@/convex/_generated/dataModel";

interface KeyMomentsTabProps {
  projectId: Id<"projects">;
  keyMoments?: {
    time: string;
    text: string;
    description: string;
  }[];
  error?: string;
}

export function KeyMomentsTab({ projectId, keyMoments, error }: KeyMomentsTabProps) {
  if (error) {
    return <ErrorRetryCard projectId={projectId} job="keyMoments" errorMessage={error} />;
  }

  if (!keyMoments || keyMoments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No key moments detected
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Timestamps</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {keyMoments.map((moment, idx) => (
            <div
              key={`${idx}-${moment.time}`}
              className="flex items-start gap-4 p-4 border rounded-lg"
            >
              <Badge variant="secondary" className="mt-1">
                {moment.time}
              </Badge>
              <div>
                <p className="font-medium">{moment.text}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {moment.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
