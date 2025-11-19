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
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useInngestSubscription } from "@inngest/realtime/hooks";
import { REALTIME_TOPICS } from "@/inngest/lib/realtime-topics";

type PhaseStatus = "pending" | "running" | "completed";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = useAuth();
  const { id } = use(params);
  const projectId = id as Id<"projects">;

  // Fetch project data from Convex (ONLY for persisted data, NOT for realtime status)
  const project = useQuery(api.projects.getProject, { projectId });

  // Track 2-phase processing status via Inngest Realtime (NOT Convex)
  const [transcriptionStatus, setTranscriptionStatus] =
    useState<PhaseStatus>("pending");
  const [generationStatus, setGenerationStatus] =
    useState<PhaseStatus>("pending");

  // Track if we've received any realtime updates
  const [hasRealtimeUpdates, setHasRealtimeUpdates] = useState(false);

  // Track processed message IDs to avoid duplicates
  const [processedMessageIds] = useState(() => new Set<string>());

  // Fetch Inngest Realtime subscription token
  const fetchRealtimeToken = useCallback(async () => {
    console.log("🔑 Fetching Inngest realtime token for project:", projectId);
    const response = await fetch(`/api/realtime/token?projectId=${projectId}`);
    const data = await response.json();
    console.log("🔑 Token received:", data.token ? "✓" : "✗");
    return data.token;
  }, [projectId]);

  // Subscribe to Inngest Realtime updates (showcasing Inngest, NOT Convex)
  const { data } = useInngestSubscription({
    refreshToken: fetchRealtimeToken,
  });

  // Process Inngest realtime messages (4 topics: transcription start/done, generation start/done)
  useEffect(() => {
    if (!data || data.length === 0) return;

    data.forEach(
      (message: { topic: string; data: Record<string, unknown> }) => {
        const messageId = `${message.topic}-${JSON.stringify(message.data)}`;

        // Skip if already processed
        if (processedMessageIds.has(messageId)) {
          return;
        }

        processedMessageIds.add(messageId);
        setHasRealtimeUpdates(true);
        console.log("📡 Inngest realtime message:", {
          topic: message.topic,
          data: message.data,
        });

        // Handle transcription phase
        if (message.topic === REALTIME_TOPICS.TRANSCRIPTION_START) {
          console.log("🎤 Transcription started");
          setTranscriptionStatus("running");
        } else if (message.topic === REALTIME_TOPICS.TRANSCRIPTION_DONE) {
          console.log("✅ Transcription completed");
          setTranscriptionStatus("completed");
        }
        // Handle generation phase
        else if (message.topic === REALTIME_TOPICS.GENERATION_START) {
          console.log("🤖 AI Generation started (6 outputs)");
          setGenerationStatus("running");
        } else if (message.topic === REALTIME_TOPICS.GENERATION_DONE) {
          console.log("✅ AI Generation completed");
          setGenerationStatus("completed");
        }
      },
    );
  }, [data, processedMessageIds]);

  // Fallback to Convex job status if no realtime updates yet
  // This ensures UI doesn't get stuck showing "pending" if realtime connection is slow
  useEffect(() => {
    if (hasRealtimeUpdates || !project) return;

    // Map Convex job status to phase status
    if (project.jobStatus?.transcription === "running") {
      setTranscriptionStatus("running");
    } else if (project.jobStatus?.transcription === "completed") {
      setTranscriptionStatus("completed");
    }

    // Check if any generation job is running or completed
    const generationJobs = [
      project.jobStatus?.keyMoments,
      project.jobStatus?.summary,
      project.jobStatus?.social,
      project.jobStatus?.titles,
      project.jobStatus?.hashtags,
      project.jobStatus?.youtubeTimestamps,
    ];

    const anyGenerationRunning = generationJobs.some(
      (job) => job === "running",
    );
    const allGenerationCompleted = generationJobs.every(
      (job) => job === "completed",
    );

    if (allGenerationCompleted) {
      setGenerationStatus("completed");
    } else if (anyGenerationRunning) {
      setGenerationStatus("running");
    }
  }, [project, hasRealtimeUpdates]);

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
  const showGenerating = isProcessing && generationStatus === "running";

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Project Details</h1>
      </div>

      {/* Project Info */}
      <div className="grid gap-6">
        <ProjectStatusCard project={project} />

        {/* Processing Flow - Only show while processing */}
        {isProcessing && (
          <ProcessingFlow
            transcriptionStatus={transcriptionStatus}
            generationStatus={generationStatus}
            fileDuration={project.fileDuration}
            createdAt={project.createdAt}
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

        {/* Results - Show skeleton while generating, populate when completed */}
        {(showGenerating || isCompleted) && (
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
              {showGenerating ? (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ) : (
                project.summary && <SummaryTab summary={project.summary} />
              )}
            </TabsContent>

            {/* Key Moments Tab */}
            <TabsContent value="moments" className="space-y-4">
              {showGenerating ? (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ) : (
                project.keyMoments && (
                  <KeyMomentsTab keyMoments={project.keyMoments} />
                )
              )}
            </TabsContent>

            {/* YouTube Timestamps Tab */}
            <TabsContent value="youtube-timestamps" className="space-y-4">
              {showGenerating ? (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ) : (
                project.youtubeTimestamps && (
                  <YouTubeTimestampsTab
                    timestamps={project.youtubeTimestamps}
                  />
                )
              )}
            </TabsContent>

            {/* Social Posts Tab */}
            <TabsContent value="social" className="space-y-4">
              {showGenerating ? (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ) : (
                project.socialPosts && (
                  <SocialPostsTab socialPosts={project.socialPosts} />
                )
              )}
            </TabsContent>

            {/* Hashtags Tab */}
            <TabsContent value="hashtags" className="space-y-4">
              {showGenerating ? (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ) : (
                project.hashtags && <HashtagsTab hashtags={project.hashtags} />
              )}
            </TabsContent>

            {/* Titles Tab */}
            <TabsContent value="titles" className="space-y-4">
              {showGenerating ? (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ) : (
                project.titles && <TitlesTab titles={project.titles} />
              )}
            </TabsContent>

            {/* Transcript Tab */}
            <TabsContent value="transcript" className="space-y-4">
              {showGenerating ? (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ) : (
                project.transcript && (
                  <TranscriptTab
                    transcript={project.transcript}
                    captions={project.captions}
                  />
                )
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
