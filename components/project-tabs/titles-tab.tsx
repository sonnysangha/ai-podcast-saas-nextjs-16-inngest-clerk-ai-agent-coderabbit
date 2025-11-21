"use client";

import { ErrorRetryCard } from "@/components/project-detail/error-retry-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Id } from "@/convex/_generated/dataModel";

interface TitlesTabProps {
  projectId: Id<"projects">;
  titles?: {
    youtubeShort: string[];
    youtubeLong: string[];
    podcastTitles: string[];
    seoKeywords: string[];
  };
  error?: string;
}

const TITLE_CATEGORIES = [
  {
    key: "youtubeShort" as const,
    title: "YouTube Short Titles",
    type: "list" as const,
  },
  {
    key: "youtubeLong" as const,
    title: "YouTube Long Titles",
    type: "list" as const,
  },
  {
    key: "podcastTitles" as const,
    title: "Podcast Titles",
    type: "list" as const,
  },
  {
    key: "seoKeywords" as const,
    title: "SEO Keywords",
    type: "badges" as const,
  },
];

export function TitlesTab({ projectId, titles, error }: TitlesTabProps) {
  if (error) {
    return <ErrorRetryCard projectId={projectId} job="titles" errorMessage={error} />;
  }

  if (!titles) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No titles available
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {TITLE_CATEGORIES.map((category) => (
        <Card key={category.key}>
          <CardHeader>
            <CardTitle>{category.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {category.type === "list" ? (
              <ul className="space-y-2">
                {titles[category.key].map((title, idx) => (
                  <li key={idx} className="p-3 border rounded-lg">
                    {title}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-wrap gap-2">
                {titles[category.key].map((keyword, idx) => (
                  <Badge key={idx} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
