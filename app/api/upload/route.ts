/**
 * File Upload API Route
 * 
 * Handles podcast file uploads using Vercel Blob's client-side upload pattern.
 * This route generates pre-signed upload URLs for secure, direct-to-blob uploads.
 * 
 * Vercel Blob Upload Pattern:
 * 1. Client requests upload URL from this endpoint
 * 2. This endpoint validates user and returns pre-signed URL
 * 3. Client uploads file directly to Vercel Blob (bypasses Next.js server)
 * 4. On completion, client calls server action to create project
 * 
 * Benefits of This Pattern:
 * - No server memory usage (direct upload)
 * - Progress tracking on client
 * - Handles large files efficiently
 * - No request size limits (uploads bypass API routes)
 * 
 * Security:
 * - Requires authentication (Clerk)
 * - Validates file types (audio/video only)
 * - Enforces size limits
 * - Pre-signed URLs expire quickly
 */
import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { apiError, withAuth } from "@/lib/api-utils";
import { ALLOWED_AUDIO_TYPES, MAX_FILE_SIZE } from "@/lib/constants";

/**
 * POST /api/upload
 * 
 * Generates pre-signed upload URL for Vercel Blob
 * 
 * Called by: Client's upload() function from @vercel/blob/client
 * Flow: Client -> This route (get URL) -> Client -> Blob (upload)
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Authenticate user via Clerk
    // Throws NextResponse with 401 if not authenticated
    await withAuth();
    
    // Parse request body (contains file metadata, not file itself)
    const body = (await request.json()) as HandleUploadBody;

    // Generate pre-signed upload URL with constraints
    const jsonResponse = await handleUpload({
      body,
      request,
      // Configuration callback - runs before URL generation
      onBeforeGenerateToken: async () => ({
        // Whitelist allowed MIME types (audio/video formats)
        allowedContentTypes: ALLOWED_AUDIO_TYPES,
        // Add random suffix to prevent filename collisions
        addRandomSuffix: true,
        // Enforce maximum file size
        maximumSizeInBytes: MAX_FILE_SIZE,
      }),
      // Callback after upload completes (client-side)
      onUploadCompleted: async ({ blob }) => {
        console.log("Blob upload completed:", blob.url);
        // Note: Project creation happens in server action, not here
      },
    });

    // Return pre-signed URL and metadata to client
    return NextResponse.json(jsonResponse);
  } catch (error) {
    // Pass through auth errors (already NextResponse)
    if (error instanceof NextResponse) return error;
    
    console.error("Upload error:", error);
    return apiError(
      error instanceof Error ? error.message : String(error),
      400,
    );
  }
}
