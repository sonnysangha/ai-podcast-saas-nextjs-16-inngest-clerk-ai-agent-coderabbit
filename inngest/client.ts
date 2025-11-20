/**
 * Inngest Client Configuration
 * 
 * Inngest is a durable execution engine for background jobs and workflows.
 * It provides:
 * - Durable execution: Steps are retried on failure, progress is never lost
 * - Real-time updates: Stream progress to the UI as jobs execute
 * - Observability: Built-in logging, metrics, and tracing
 * - Type safety: Full TypeScript support for events and functions
 * 
 * Architecture:
 * - Client is used to define functions and send events
 * - Functions run on Inngest's infrastructure (or self-hosted)
 * - Events trigger functions via the /api/inngest webhook
 * 
 * Real-time Middleware:
 * - Enables publish() API to send progress updates to subscribed clients
 * - Frontend subscribes via Inngest's real-time API
 * - Updates are delivered via Server-Sent Events (SSE)
 */
import { realtimeMiddleware } from "@inngest/realtime/middleware";
import { Inngest } from "inngest";

// Initialize Inngest client with real-time support
// The ID must match across all environments (dev, staging, prod)
export const inngest = new Inngest({
  id: "ai-podcast-saas-inngest-coderabbit-clerk",
  // Real-time middleware enables publish() for streaming updates to the UI
  middleware: [realtimeMiddleware()],
});
