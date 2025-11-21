/**
 * Project Server Actions
 * 
 * Next.js server actions for project creation and workflow triggering.
 * Called from client components after file upload completes.
 * 
 * Server Actions vs. API Routes:
 * - Server actions are RSC (React Server Components) feature
 * - Simpler than API routes (no route definition, just async functions)
 * - Automatic form integration, progressive enhancement
 * - Type-safe: Client gets full TypeScript types
 * 
 * Security:
 * - Runs on server (access to server-only APIs)
 * - Validates auth via Clerk
 * - Can't be bypassed by client
 */
"use server";

import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";

interface CreateProjectInput {
  fileUrl: string; // Vercel Blob URL
  fileName: string; // Original filename
  fileSize: number; // Bytes
  mimeType: string; // MIME type
  fileDuration?: number; // Seconds (optional)
}

/**
 * Create project and trigger Inngest workflow
 * 
 * Atomic Operation (both or neither):
 * 1. Create project record in Convex
 * 2. Send event to Inngest to start processing
 * 
 * Flow:
 * 1. Client uploads file to Vercel Blob
 * 2. Client calls this server action with file metadata
 * 3. This action creates Convex project (status: "uploaded")
 * 4. This action triggers Inngest workflow
 * 5. Inngest processes podcast asynchronously
 * 6. Client redirects to project detail page
 * 
 * Error Handling:
 * - Throws on auth failure (caught by client)
 * - Throws on missing fields (caught by client)
 * - Throws on Convex/Inngest errors (caught by client)
 * - Client shows error toast and allows retry
 * 
 * @param input - File metadata from Vercel Blob upload
 * @returns Project ID for navigation
 * @throws Error if authentication fails or required fields missing
 */
export async function createProjectAction(input: CreateProjectInput) {
  try {
    // Authenticate user via Clerk
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const { fileUrl, fileName, fileSize, mimeType, fileDuration } = input;

    // Validate required fields
    if (!fileUrl || !fileName) {
      throw new Error("Missing required fields");
    }

    // Extract file extension for display
    const fileExtension = fileName.split(".").pop() || "unknown";

    // Create project in Convex database
    // Status starts as "uploaded", will be updated by Inngest
    const projectId = await convex.mutation(api.projects.createProject, {
      userId,
      inputUrl: fileUrl,
      fileName,
      fileSize: fileSize || 0,
      fileDuration,
      fileFormat: fileExtension,
      mimeType: mimeType || "application/octet-stream",
    });

    // Trigger Inngest workflow asynchronously
    // Event name "podcast/uploaded" matches workflow trigger
    await inngest.send({
      name: "podcast/uploaded",
      data: {
        projectId, // Convex project ID
        userId,
        fileUrl, // URL to audio file in Blob
        fileName,
        fileSize: fileSize || 0,
        mimeType: mimeType || "application/octet-stream",
      },
    });

    return { success: true, projectId };
  } catch (error) {
    console.error("Error creating project:", error);
    throw error; // Re-throw for client error handling
  }
}

/**
 * Delete project and associated Blob storage
 * 
 * Flow:
 * 1. Validate user authentication
 * 2. Call Convex mutation to delete project (validates ownership)
 * 3. Delete file from Vercel Blob storage
 * 
 * Error Handling:
 * - Throws on auth failure
 * - Throws if project not found or user doesn't own it
 * - Logs but doesn't throw on Blob deletion failure (already deleted from DB)
 * 
 * @param projectId - Convex project ID
 * @returns Success response
 * @throws Error if authentication fails or user doesn't own project
 */
export async function deleteProjectAction(projectId: Id<"projects">) {
  try {
    // Authenticate user via Clerk
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Delete from Convex (validates ownership, returns inputUrl)
    const result = await convex.mutation(api.projects.deleteProject, {
      projectId,
      userId,
    });

    // Delete file from Vercel Blob
    // If this fails, we've already deleted from DB - log but don't throw
    try {
      await del(result.inputUrl);
    } catch (blobError) {
      console.error("Failed to delete file from Blob storage:", blobError);
      // Don't throw - project is already deleted from database
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
}

/**
 * Update project display name
 * 
 * Flow:
 * 1. Validate user authentication
 * 2. Call Convex mutation to update displayName (validates ownership)
 * 
 * Real-time Impact:
 * - All subscribed components instantly see the new name
 * 
 * @param projectId - Convex project ID
 * @param displayName - New display name
 * @returns Success response
 * @throws Error if authentication fails or user doesn't own project
 */
export async function updateDisplayNameAction(
  projectId: Id<"projects">,
  displayName: string
) {
  try {
    // Authenticate user via Clerk
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Validate display name
    if (!displayName || displayName.trim().length === 0) {
      throw new Error("Display name cannot be empty");
    }

    if (displayName.length > 200) {
      throw new Error("Display name is too long (max 200 characters)");
    }

    // Update in Convex (validates ownership)
    await convex.mutation(api.projects.updateProjectDisplayName, {
      projectId,
      userId,
      displayName: displayName.trim(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating display name:", error);
    throw error;
  }
}
