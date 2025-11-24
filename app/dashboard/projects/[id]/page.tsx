"use client";

import { useAuth, Protect } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import {
  AlertCircle,
  Edit2,
  Loader2,
  Save,
  Trash2,
  X,
  Lock,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import {
  deleteProjectAction,
  updateDisplayNameAction,
} from "@/app/actions/projects";
import { ProcessingFlow } from "@/components/processing-flow";
import { TabContent } from "@/components/project-detail/tab-content";
import { ProjectStatusCard } from "@/components/project-status-card";
import { HashtagsTab } from "@/components/project-tabs/hashtags-tab";
import { KeyMomentsTab } from "@/components/project-tabs/key-moments-tab";
import { SocialPostsTab } from "@/components/project-tabs/social-posts-tab";
import { SummaryTab } from "@/components/project-tabs/summary-tab";
import { TitlesTab } from "@/components/project-tabs/titles-tab";
import { TranscriptTab } from "@/components/project-tabs/transcript-tab";
import { YouTubeTimestampsTab } from "@/components/project-tabs/youtube-timestamps-tab";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { PhaseStatus } from "@/lib/types";
import { FEATURES } from "@/lib/tier-config";

export default function ProjectDetailPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const { id } = useParams();

  const projectId = id as Id<"projects">;

  // Convex is the single source of truth - real-time updates via subscription
  const project = useQuery(api.projects.getProject, { projectId });

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tab state for mobile dropdown
  const [activeTab, setActiveTab] = useState("summary");

  // Get status from Convex jobStatus (initialized on project creation)
  const transcriptionStatus: PhaseStatus =
    project?.jobStatus?.transcription || "pending";
  const generationStatus: PhaseStatus =
    project?.jobStatus?.contentGeneration || "pending";

  // Handle edit title
  const handleStartEdit = () => {
    setEditedName(project?.displayName || project?.fileName || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName("");
  };

  const handleSaveEdit = async () => {
    if (!editedName.trim()) {
      toast.error("Project name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      await updateDisplayNameAction(projectId, editedName);
      toast.success("Project name updated");
      setIsEditing(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update name",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project? This action cannot be undone.",
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteProjectAction(projectId);
      toast.success("Project deleted");
      router.push("/dashboard/projects");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project",
      );
      setIsDeleting(false);
    }
  };

  if (!project) {
    return (
      <div className="container max-w-6xl mx-auto py-10 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

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
    <div className="container max-w-6xl mx-auto py-10 px-4 ">
      {/* Header with title and actions */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-2xl font-bold h-auto py-2"
                placeholder="Project name"
                autoFocus
                disabled={isSaving}
              />
              <Button size="sm" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold break-words">
                {project.displayName || project.fileName}
              </h1>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!isEditing && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleStartEdit}
              className="glass-card hover-lift border-2 border-emerald-200 hover:border-emerald-400 px-6 bg-white"
            >
              <Edit2 className="h-4 w-4 mr-2 text-emerald-600" />
              <span className="font-semibold text-emerald-700">Edit</span>
            </Button>
          )}
          <Button
            size="lg"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gradient-emerald text-white hover-glow px-6 transition-all"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            <span className="font-semibold">Delete</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <ProjectStatusCard project={project} />

        {isProcessing && (
          <ProcessingFlow
            transcriptionStatus={transcriptionStatus}
            generationStatus={generationStatus}
            fileDuration={project.fileDuration}
            createdAt={project.createdAt}
          />
        )}

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

        {(showGenerating || isCompleted) && (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            {/* Mobile Dropdown */}
            <div className="glass-card rounded-2xl p-4 mb-6 lg:hidden">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-semibold text-base border-none outline-none focus:ring-2 focus:ring-emerald-300 transition-all h-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">
                    <span className="flex items-center gap-2">
                      Summary
                      {project.jobErrors?.summary && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </span>
                  </SelectItem>
                  <SelectItem value="moments">
                    <span className="flex items-center gap-2">
                      Key Moments
                      {project.jobErrors?.keyMoments && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <Protect
                        feature={FEATURES.KEY_MOMENTS}
                        fallback={<Lock className="h-3 w-3" />}
                      />
                    </span>
                  </SelectItem>
                  <SelectItem value="youtube-timestamps">
                    <span className="flex items-center gap-2">
                      YouTube Timestamps
                      {project.jobErrors?.youtubeTimestamps && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <Protect
                        feature={FEATURES.YOUTUBE_TIMESTAMPS}
                        fallback={<Lock className="h-3 w-3" />}
                      />
                    </span>
                  </SelectItem>
                  <SelectItem value="social">
                    <span className="flex items-center gap-2">
                      Social Posts
                      {project.jobErrors?.socialPosts && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <Protect
                        feature={FEATURES.SOCIAL_POSTS}
                        fallback={<Lock className="h-3 w-3" />}
                      />
                    </span>
                  </SelectItem>
                  <SelectItem value="hashtags">
                    <span className="flex items-center gap-2">
                      Hashtags
                      {project.jobErrors?.hashtags && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <Protect
                        feature={FEATURES.HASHTAGS}
                        fallback={<Lock className="h-3 w-3" />}
                      />
                    </span>
                  </SelectItem>
                  <SelectItem value="titles">
                    <span className="flex items-center gap-2">
                      Titles
                      {project.jobErrors?.titles && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <Protect
                        feature={FEATURES.TITLES}
                        fallback={<Lock className="h-3 w-3" />}
                      />
                    </span>
                  </SelectItem>
                  <SelectItem value="speakers">
                    <span className="flex items-center gap-2">
                      Speaker Dialogue
                      <Protect
                        feature={FEATURES.SPEAKER_DIARIZATION}
                        fallback={<Lock className="h-3 w-3" />}
                      />
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desktop Tabs */}
            <div className="glass-card rounded-2xl p-2 mb-6 hidden lg:block">
              <TabsList className="flex flex-wrap gap-2 bg-transparent min-w-max w-full">
                <TabsTrigger
                  value="summary"
                  className="flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-400 data-[state=active]:text-white transition-all font-semibold whitespace-nowrap"
                >
                  Summary
                  {project.jobErrors?.summary && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="moments"
                  className="flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-400 data-[state=active]:text-white transition-all font-semibold whitespace-nowrap"
                >
                  Key Moments
                  {project.jobErrors?.keyMoments && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <Protect
                    feature={FEATURES.KEY_MOMENTS}
                    fallback={<Lock className="h-3 w-3" />}
                  />
                </TabsTrigger>
                <TabsTrigger
                  value="youtube-timestamps"
                  className="flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-400 data-[state=active]:text-white transition-all font-semibold whitespace-nowrap"
                >
                  YouTube Timestamps
                  {project.jobErrors?.youtubeTimestamps && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <Protect
                    feature={FEATURES.YOUTUBE_TIMESTAMPS}
                    fallback={<Lock className="h-3 w-3" />}
                  />
                </TabsTrigger>
                <TabsTrigger
                  value="social"
                  className="flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-400 data-[state=active]:text-white transition-all font-semibold whitespace-nowrap"
                >
                  Social Posts
                  {project.jobErrors?.socialPosts && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <Protect
                    feature={FEATURES.SOCIAL_POSTS}
                    fallback={<Lock className="h-3 w-3" />}
                  />
                </TabsTrigger>
                <TabsTrigger
                  value="hashtags"
                  className="flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-400 data-[state=active]:text-white transition-all font-semibold whitespace-nowrap"
                >
                  Hashtags
                  {project.jobErrors?.hashtags && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <Protect
                    feature={FEATURES.HASHTAGS}
                    fallback={<Lock className="h-3 w-3" />}
                  />
                </TabsTrigger>
                <TabsTrigger
                  value="titles"
                  className="flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-400 data-[state=active]:text-white transition-all font-semibold whitespace-nowrap"
                >
                  Titles
                  {project.jobErrors?.titles && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <Protect
                    feature={FEATURES.TITLES}
                    fallback={<Lock className="h-3 w-3" />}
                  />
                </TabsTrigger>
                <TabsTrigger
                  value="speakers"
                  className="flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-400 data-[state=active]:text-white transition-all font-semibold whitespace-nowrap"
                >
                  Speaker Dialogue
                  <Protect
                    feature={FEATURES.SPEAKER_DIARIZATION}
                    fallback={<Lock className="h-3 w-3" />}
                  />
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="summary" className="space-y-4">
              <TabContent
                isLoading={showGenerating}
                data={project.summary}
                error={project.jobErrors?.summary}
              >
                <SummaryTab
                  projectId={projectId}
                  summary={project.summary}
                  error={project.jobErrors?.summary}
                />
              </TabContent>
            </TabsContent>

            <TabsContent value="moments" className="space-y-4">
              <TabContent
                isLoading={showGenerating}
                data={project.keyMoments}
                error={project.jobErrors?.keyMoments}
              >
                <KeyMomentsTab
                  projectId={projectId}
                  keyMoments={project.keyMoments}
                  error={project.jobErrors?.keyMoments}
                />
              </TabContent>
            </TabsContent>

            <TabsContent value="youtube-timestamps" className="space-y-4">
              <TabContent
                isLoading={showGenerating}
                data={project.youtubeTimestamps}
                error={project.jobErrors?.youtubeTimestamps}
              >
                <YouTubeTimestampsTab
                  projectId={projectId}
                  timestamps={project.youtubeTimestamps}
                  error={project.jobErrors?.youtubeTimestamps}
                />
              </TabContent>
            </TabsContent>

            <TabsContent value="social" className="space-y-4">
              <TabContent
                isLoading={showGenerating}
                data={project.socialPosts}
                error={project.jobErrors?.socialPosts}
              >
                <SocialPostsTab
                  projectId={projectId}
                  socialPosts={project.socialPosts}
                  error={project.jobErrors?.socialPosts}
                />
              </TabContent>
            </TabsContent>

            <TabsContent value="hashtags" className="space-y-4">
              <TabContent
                isLoading={showGenerating}
                data={project.hashtags}
                error={project.jobErrors?.hashtags}
              >
                <HashtagsTab
                  projectId={projectId}
                  hashtags={project.hashtags}
                  error={project.jobErrors?.hashtags}
                />
              </TabContent>
            </TabsContent>

            <TabsContent value="titles" className="space-y-4">
              <TabContent
                isLoading={showGenerating}
                data={project.titles}
                error={project.jobErrors?.titles}
              >
                <TitlesTab
                  projectId={projectId}
                  titles={project.titles}
                  error={project.jobErrors?.titles}
                />
              </TabContent>
            </TabsContent>

            <TabsContent value="speakers" className="space-y-4">
              <TabContent isLoading={showGenerating} data={project.transcript}>
                {project.transcript && (
                  <TranscriptTab
                    projectId={projectId}
                    transcript={project.transcript}
                  />
                )}
              </TabContent>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
