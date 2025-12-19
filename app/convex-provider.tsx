/**
 * Convex Client Provider
 * 
 * Wraps the application with Convex real-time database client.
 * Integrates Clerk authentication with Convex for secure, authenticated queries.
 * 
 * Convex + Clerk Integration:
 * - ConvexProviderWithClerk automatically passes Clerk JWT to Convex
 * - Convex validates JWT against auth.config.ts settings
 * - useQuery/useMutation hooks have access to user identity
 * - Server-side functions (mutations/queries) can access ctx.auth
 * 
 * Real-time Reactivity:
 * - All components using useQuery automatically re-render on data changes
 * - No polling, no manual cache invalidation required
 * - Optimistic updates supported out of the box
 * 
 * Setup:
 * - Wrap app in layout.tsx with this provider
 * - Must be inside Clerk's ClerkProvider
 * - NEXT_PUBLIC_CONVEX_URL environment variable required
 */
"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactNode } from "react";

// Initialize Convex React client with deployment URL
// This client handles real-time subscriptions and optimistic updates
const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL! as string,
);

/**
 * Convex provider component with Clerk authentication integration
 * 
 * Provides:
 * - Real-time database access via useQuery/useMutation
 * - Automatic authentication via Clerk
 * - Optimistic updates and caching
 * 
 * Usage in layout.tsx:
 * ```tsx
 * <ClerkProvider>
 *   <ConvexClientProvider>
 *     {children}
 *   </ConvexClientProvider>
 * </ClerkProvider>
 * ```
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
