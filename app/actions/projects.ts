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
import { api } from "@/convex/_generated/api";
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
