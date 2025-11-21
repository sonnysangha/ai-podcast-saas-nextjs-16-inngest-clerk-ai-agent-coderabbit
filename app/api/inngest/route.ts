/**
 * Inngest Webhook Endpoint
 *
 * This route serves as the webhook endpoint for Inngest to communicate with your functions.
 * Inngest uses this endpoint to:
 * - Discover registered functions
 * - Execute function steps
 * - Deliver events
 *
 * How It Works:
 * 1. During deployment, Inngest calls GET /api/inngest to discover functions
 * 2. When events are sent (e.g., "podcast/uploaded"), Inngest calls POST /api/inngest
 * 3. This route invokes the appropriate function based on event type
 * 4. Function execution happens on your infrastructure (Next.js server)
 *
 * Configuration:
 * - Register all Inngest functions in the functions array
 * - Inngest client must match across all files
 * - Endpoint must be publicly accessible for Inngest cloud
 *
 * Development vs. Production:
 * - Dev: Inngest Dev Server (npx inngest-cli dev) proxies to this endpoint
 * - Prod: Inngest cloud calls this endpoint directly
 */
import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { podcastProcessor } from "../../../inngest/functions/podcast-processor";
import { retryJobFunction } from "../../../inngest/functions/retry-job";

// Force dynamic rendering (disable static optimization)
// Required because Inngest needs to call this endpoint at runtime
export const dynamic = "force-dynamic";

/**
 * Inngest HTTP handler for Next.js App Router
 *
 * Exports GET, POST, PUT handlers that Inngest uses for:
 * - GET: Function discovery and health checks
 * - POST: Event delivery and step execution
 * - PUT: Function registration
 *
 * Functions Array:
 * - Add all Inngest functions here to register them
 * - Functions are discovered automatically on deployment
 */
export const { GET, POST, PUT } = serve({
  client: inngest, // Inngest client instance
  functions: [podcastProcessor, retryJobFunction], // Array of all Inngest functions to serve
});
