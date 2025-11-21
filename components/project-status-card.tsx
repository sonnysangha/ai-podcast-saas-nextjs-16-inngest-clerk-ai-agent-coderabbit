import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Doc } from "@/convex/_generated/dataModel";
import { formatDuration, formatFileSize, formatSmartDate } from "@/lib/format";
import { getStatusVariant } from "@/lib/status-utils";

interface ProjectStatusCardProps {
  project: Doc<"projects">;
}

export function ProjectStatusCard({ project }: ProjectStatusCardProps) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          {/* Project Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold wrap-break-words mb-1">
              {project.fileName}
            </h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              <span>{formatSmartDate(project.createdAt)}</span>
              <span>•</span>
              <span>{formatFileSize(project.fileSize)}</span>
              <span>•</span>
              <span className="uppercase">{project.fileFormat}</span>
              {project.fileDuration && (
                <>
                  <span>•</span>
                  <span>{formatDuration(project.fileDuration)}</span>
                </>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <Badge
            variant={getStatusVariant(project.status)}
            className="shrink-0"
          >
            {project.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
