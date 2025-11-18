"use client";

import { use, useState, useCallback, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ProjectStatusCard } from "@/components/project-status-card";
import { ProcessingFlow } from "@/components/processing-flow";
import { SummaryTab } from "@/components/project-tabs/summary-tab";
import { KeyMomentsTab } from "@/components/project-tabs/key-moments-tab";
import { SocialPostsTab } from "@/components/project-tabs/social-posts-tab";
import { HashtagsTab } from "@/components/project-tabs/hashtags-tab";
import { TitlesTab } from "@/components/project-tabs/titles-tab";
import { TranscriptTab } from "@/components/project-tabs/transcript-tab";
import { YouTubeTimestampsTab } from "@/components/project-tabs/youtube-timestamps-tab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useInngestSubscription } from "@inngest/realtime/hooks";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = useAuth();
  const { id } = use(params);
  const projectId = id as Id<"projects">;

  // Fetch project data from Convex (for persistence)
  const project = useQuery(api.projects.getProject, { projectId });

  // State for real-time updates from Inngest Realtime
  const [processingStatus, setProcessingStatus] = useState<{
    step?: string;
    status?: string;
    message?: string;
    progress?: number;
  } | null>(null);

  // Track all step updates for showing completion messages
  const [stepUpdates, setStepUpdates] = useState<
    Map<string, { message: string; status: string }>
  >(new Map());

  // Fetch Inngest Realtime subscription token
  const fetchRealtimeToken = useCallback(async () => {
    const response = await fetch(`/api/realtime/token?projectId=${projectId}`);
    const data = await response.json();
    return data.token;
  }, [projectId]);

  // Subscribe to Inngest Realtime updates (showcases real-time streaming!)
  const { freshData } = useInngestSubscription({
    refreshToken: fetchRealtimeToken,
  });

  // Process real-time messages from Inngest
  useEffect(() => {
    if (!freshData || freshData.length === 0) return;

    freshData.forEach(
      (message: { topic: string; data: Record<string, unknown> }) => {
        if (message.topic === "processing") {
          const data = message.data as typeof processingStatus;
          setProcessingStatus(data);

          // Track updates for each step (including completion messages)
          if (data?.step && data?.message && data.step) {
            setStepUpdates((prev) => {
              const newMap = new Map(prev);
              newMap.set(data.step as string, {
                message: data.message as string,
                status: (data.status as string) || "running",
              });
              return newMap;
            });
          }
        }
      },
    );
  }, [freshData]);

  if (!project) {
    return (
      <div className="container max-w-6xl mx-auto py-10 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Check if user owns this project
  if (project.userId !== userId) {
    return (
      <div className="container max-w-6xl mx-auto py-10 px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You don't have access to this project.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProcessing = project.status === "processing";
  const isCompleted = project.status === "completed";
  const hasFailed = project.status === "failed";

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Project Details</h1>
      </div>

      {/* Project Info */}
      <div className="grid gap-6">
        <ProjectStatusCard project={project} />

        {/* Processing Steps - Only show while processing (hide when completed) */}
        {isProcessing && (
          <ProcessingFlow
            jobStatus={project.jobStatus}
            fileDuration={project.fileDuration}
            createdAt={project.createdAt}
            stepUpdates={stepUpdates}
          />
        )}

        {/* Error Message */}
        {hasFailed && project.error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{project.error.message}</p>
              {project.error.step && (
                <p className="text-sm text-muted-foreground mt-2">
                  Failed at: {project.error.step}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results - Only show when completed */}
        {isCompleted && (
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="flex flex-col md:flex-row md:inline-flex w-full md:w-auto h-auto">
              <TabsTrigger value="summary" className="w-full md:w-auto">
                Summary
              </TabsTrigger>
              <TabsTrigger value="moments" className="w-full md:w-auto">
                Key Moments
              </TabsTrigger>
              <TabsTrigger
                value="youtube-timestamps"
                className="w-full md:w-auto"
              >
                YouTube Timestamps
              </TabsTrigger>
              <TabsTrigger value="social" className="w-full md:w-auto">
                Social Posts
              </TabsTrigger>
              <TabsTrigger value="hashtags" className="w-full md:w-auto">
                Hashtags
              </TabsTrigger>
              <TabsTrigger value="titles" className="w-full md:w-auto">
                Titles
              </TabsTrigger>
              <TabsTrigger value="transcript" className="w-full md:w-auto">
                Transcript
              </TabsTrigger>
            </TabsList>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-4">
              {project.summary && <SummaryTab summary={project.summary} />}
            </TabsContent>

            {/* Key Moments Tab */}
            <TabsContent value="moments" className="space-y-4">
              {project.keyMoments && (
                <KeyMomentsTab keyMoments={project.keyMoments} />
              )}
            </TabsContent>

            {/* YouTube Timestamps Tab */}
            <TabsContent value="youtube-timestamps" className="space-y-4">
              {project.youtubeTimestamps && (
                <YouTubeTimestampsTab timestamps={project.youtubeTimestamps} />
              )}
            </TabsContent>

            {/* Social Posts Tab */}
            <TabsContent value="social" className="space-y-4">
              {project.socialPosts && (
                <SocialPostsTab socialPosts={project.socialPosts} />
              )}
            </TabsContent>

            {/* Hashtags Tab */}
            <TabsContent value="hashtags" className="space-y-4">
              {project.hashtags && <HashtagsTab hashtags={project.hashtags} />}
            </TabsContent>

            {/* Titles Tab */}
            <TabsContent value="titles" className="space-y-4">
              {project.titles && <TitlesTab titles={project.titles} />}
            </TabsContent>

            {/* Transcript Tab */}
            <TabsContent value="transcript" className="space-y-4">
              {project.transcript && (
                <TranscriptTab
                  transcript={project.transcript}
                  captions={project.captions}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
