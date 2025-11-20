/**
 * Inngest Real-time Subscription Token Endpoint
 * 
 * Generates authentication tokens for Inngest's real-time event streaming.
 * Frontend uses these tokens to subscribe to workflow progress updates.
 * 
 * Real-time Architecture:
 * 1. Client requests token for a specific project
 * 2. This endpoint validates ownership and generates scoped token
 * 3. Client uses token to establish Server-Sent Events (SSE) connection
 * 4. Inngest workflow publishes events (transcription start, generation done, etc.)
 * 5. Client receives events and updates UI in real-time
 * 
 * Security:
 * - Requires authentication (Clerk)
 * - Validates project ownership (user can only subscribe to their own projects)
 * - Tokens are scoped to specific channel and topics
 * - Tokens expire (handled by Inngest SDK)
 * 
 * Channel Namespacing:
 * - Format: `project:${projectId}`
 * - Isolates updates per project (no cross-project leakage)
 * - Multiple clients can subscribe to same channel
 * 
 * Topics:
 * - Filters events within a channel
 * - Only subscribed topics are delivered to client
 * - Reduces bandwidth and improves security
 */
import { getSubscriptionToken } from "@inngest/realtime";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { inngest } from "@/inngest/client";
import { REALTIME_TOPICS } from "@/inngest/lib/realtime-topics";
import { apiError, apiResponse, withAuth } from "@/lib/api-utils";
import { convex } from "@/lib/convex-client";

/**
 * GET /api/realtime/token?projectId=xxx
 * 
 * Returns a scoped subscription token for Inngest real-time events
 * 
 * Query Parameters:
 * - projectId: Convex project ID to subscribe to
 * 
 * Response:
 * - { token: string } - Use with Inngest's useSubscription hook
 */
export async function GET(request: Request) {
  try {
    // Authenticate and get user ID
    const { userId } = await withAuth();
    
    // Extract and validate project ID from query params
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") as Id<"projects"> | null;

    if (!projectId) {
      return apiError("Missing projectId", 400);
    }

    // Fetch project from Convex to verify ownership
    const project = await convex.query(api.projects.getProject, { projectId });

    if (!project) {
      return apiError("Project not found", 404);
    }

    // Authorization: Only project owner can subscribe to its updates
    if (project.userId !== userId) {
      return apiError("Forbidden", 403);
    }

    // Define channel and topics for subscription
    const channelName = `project:${projectId}`; // Channel namespacing
    const topics = [
      // Subscribe to all workflow progress events
      REALTIME_TOPICS.TRANSCRIPTION_START,
      REALTIME_TOPICS.TRANSCRIPTION_DONE,
      REALTIME_TOPICS.GENERATION_START,
      REALTIME_TOPICS.GENERATION_DONE,
    ];

    console.log("🎫 Generating subscription token for channel:", channelName);

    // Generate scoped subscription token
    // Token grants access to specific channel/topics only
    const token = await getSubscriptionToken(inngest, {
      channel: channelName,
      topics,
    });

    // Return token to client for SSE connection
    return apiResponse({ token });
  } catch (error) {
    // Pass through auth errors (already formatted as NextResponse)
    if (error instanceof NextResponse) return error;
    
    console.error("Error generating subscription token:", error);
    return apiError(
      error instanceof Error
        ? error.message
        : "Failed to generate subscription token",
    );
  }
}
