/**
 * Server-Side Convex Client
 * 
 * HTTP client for calling Convex mutations and queries from server environments.
 * Used in:
 * - Next.js server actions
 * - API routes
 * - Inngest functions (background jobs)
 * 
 * Singleton Pattern:
 * - One client instance shared across the application
 * - Reduces connection overhead
 * - Maintains consistent configuration
 * 
 * Why HTTP Client vs. React Client?
 * - React client (useQuery/useMutation) is for frontend only
 * - HTTP client works in Node.js (server actions, API routes, Inngest)
 * - HTTP client makes direct authenticated calls to Convex
 * 
 * Authentication:
 * - Uses Convex deployment URL from environment
 * - Public mutations/queries are accessible
 * - Private functions require auth (handled by Convex)
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_CONVEX_URL: Convex deployment URL
 * - Must match frontend Convex provider configuration
 */
import { ConvexHttpClient } from "convex/browser";

/**
 * Singleton Convex HTTP client instance
 * 
 * Initialized with deployment URL from environment.
 * Used across server actions, API routes, and Inngest functions.
 * 
 * Usage Example:
 * ```ts
 * import { convex } from '@/lib/convex-client';
 * import { api } from '@/convex/_generated/api';
 * 
 * // In server action or Inngest function:
 * await convex.mutation(api.projects.createProject, { ... });
 * const project = await convex.query(api.projects.getProject, { projectId });
 * ```
 */
export const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "",
);

