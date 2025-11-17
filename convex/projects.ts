import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new project when a file is uploaded
 */
export const createProject = mutation({
  args: {
    userId: v.string(),
    inputUrl: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    fileDuration: v.optional(v.number()),
    fileFormat: v.string(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const projectId = await ctx.db.insert("projects", {
      userId: args.userId,
      inputUrl: args.inputUrl,
      fileName: args.fileName,
      fileSize: args.fileSize,
      fileDuration: args.fileDuration,
      fileFormat: args.fileFormat,
      mimeType: args.mimeType,
      status: "uploaded",
      jobStatus: {
        audioExtraction: "pending",
        transcription: "pending",
        keyMoments: "pending",
        summary: "pending",
        captions: "pending",
        titles: "pending",
        hashtags: "pending",
      },
      createdAt: now,
      updatedAt: now,
    });

    return projectId;
  },
});

/**
 * Update the overall project status
 */
export const updateProjectStatus = mutation({
  args: {
    projectId: v.id("projects"),
    status: v.union(
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const updates: Partial<Doc<"projects">> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    // Set completedAt timestamp when project is completed
    if (args.status === "completed") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.projectId, updates);
  },
});

/**
 * Update the status of a specific job/step
 */
export const updateJobStatus = mutation({
  args: {
    projectId: v.id("projects"),
    job: v.union(
      v.literal("audioExtraction"),
      v.literal("transcription"),
      v.literal("keyMoments"),
      v.literal("summary"),
      v.literal("captions"),
      v.literal("titles"),
      v.literal("hashtags")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("skipped")
    ),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await ctx.db.patch(args.projectId, {
      jobStatus: {
        ...project.jobStatus,
        [args.job]: args.status,
      },
      updatedAt: Date.now(),
    });
  },
});

/**
 * Save the transcript result
 */
export const saveTranscript = mutation({
  args: {
    projectId: v.id("projects"),
    transcript: v.object({
      text: v.string(),
      segments: v.array(
        v.object({
          id: v.number(),
          start: v.number(),
          end: v.number(),
          text: v.string(),
          words: v.optional(
            v.array(
              v.object({
                word: v.string(),
                start: v.number(),
                end: v.number(),
              })
            )
          ),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      transcript: args.transcript,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Save generated content from parallel processing steps
 * This is called after all parallel jobs complete
 */
export const saveGeneratedContent = mutation({
  args: {
    projectId: v.id("projects"),
    keyMoments: v.optional(
      v.array(
        v.object({
          time: v.string(),
          timestamp: v.number(),
          text: v.string(),
          description: v.string(),
        })
      )
    ),
    summary: v.optional(
      v.object({
        full: v.string(),
        bullets: v.array(v.string()),
        insights: v.array(v.string()),
        tldr: v.string(),
      })
    ),
    captions: v.optional(
      v.object({
        srtUrl: v.string(),
        rawText: v.string(),
      })
    ),
    titles: v.optional(
      v.object({
        youtubeShort: v.array(v.string()),
        youtubeLong: v.array(v.string()),
        podcastTitles: v.array(v.string()),
        seoKeywords: v.array(v.string()),
      })
    ),
    hashtags: v.optional(
      v.object({
        youtube: v.array(v.string()),
        instagram: v.array(v.string()),
        tiktok: v.array(v.string()),
        linkedin: v.array(v.string()),
        twitter: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { projectId, ...content } = args;

    await ctx.db.patch(projectId, {
      ...content,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update processing metrics
 */
export const updateMetrics = mutation({
  args: {
    projectId: v.id("projects"),
    metrics: v.object({
      totalProcessingTime: v.optional(v.number()),
      transcriptionTokens: v.optional(v.number()),
      generationTokens: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Merge with existing metrics
    const updatedMetrics = {
      ...project.metrics,
      ...args.metrics,
    };

    await ctx.db.patch(args.projectId, {
      metrics: updatedMetrics,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Save the audio URL after extraction from video
 */
export const saveAudioUrl = mutation({
  args: {
    projectId: v.id("projects"),
    audioUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      audioUrl: args.audioUrl,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Record an error that occurred during processing
 */
export const recordError = mutation({
  args: {
    projectId: v.id("projects"),
    message: v.string(),
    step: v.string(),
    details: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      status: "failed",
      error: {
        message: args.message,
        step: args.step,
        timestamp: Date.now(),
        details: args.details,
      },
      updatedAt: Date.now(),
    });
  },
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a single project by ID
 */
export const getProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

/**
 * List all projects for a user with pagination
 */
export const listUserProjects = query({
  args: {
    userId: v.string(),
    paginationOpts: v.optional(
      v.object({
        numItems: v.number(),
        cursor: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const numItems = args.paginationOpts?.numItems ?? 20;

    const query = ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    return await query.paginate({
      numItems,
      cursor: args.paginationOpts?.cursor ?? null,
    });
  },
});

/**
 * Get projects by status for a user
 */
export const getProjectsByStatus = query({
  args: {
    userId: v.string(),
    status: v.union(
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", args.userId).eq("status", args.status)
      )
      .order("desc")
      .collect();
  },
});

/**
 * Get processing metrics/analytics for a user
 */
export const getProcessingMetrics = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Aggregate metrics
    const totalProjects = projects.length;
    let completedProjects = 0;
    let failedProjects = 0;
    let processingProjects = 0;
    let totalProcessingTime = 0;
    let totalTranscriptionTokens = 0;
    let totalGenerationTokens = 0;

    for (const project of projects) {
      if (project.status === "completed") completedProjects++;
      if (project.status === "failed") failedProjects++;
      if (project.status === "processing") processingProjects++;

      if (project.metrics) {
        totalProcessingTime += project.metrics.totalProcessingTime || 0;
        totalTranscriptionTokens += project.metrics.transcriptionTokens || 0;
        totalGenerationTokens += project.metrics.generationTokens || 0;
      }
    }

    return {
      totalProjects,
      completedProjects,
      failedProjects,
      processingProjects,
      averageProcessingTime:
        completedProjects > 0 ? totalProcessingTime / completedProjects : 0,
      totalTranscriptionTokens,
      totalGenerationTokens,
      totalTokens: totalTranscriptionTokens + totalGenerationTokens,
    };
  },
});

/**
 * Get recent projects across all users (admin view)
 */
export const getRecentProjects = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    return await ctx.db
      .query("projects")
      .withIndex("by_created_at")
      .order("desc")
      .take(limit);
  },
});
