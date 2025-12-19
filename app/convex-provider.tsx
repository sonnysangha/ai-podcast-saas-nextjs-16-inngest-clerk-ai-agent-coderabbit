
"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactNode } from "react";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL! as string
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
