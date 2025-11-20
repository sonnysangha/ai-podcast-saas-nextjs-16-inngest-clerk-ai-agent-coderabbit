/**
 * Convex Authentication Configuration
 * 
 * This file configures Clerk as the authentication provider for Convex.
 * Convex validates JWT tokens from Clerk on every request to ensure users are authenticated.
 * 
 * Integration Flow:
 * 1. User signs in via Clerk on the frontend
 * 2. Clerk issues a JWT token with the configured issuer domain
 * 3. Frontend passes this token to Convex with each request
 * 4. Convex validates the token against this auth config
 * 5. If valid, the user's identity is available in ctx.auth in mutations/queries
 * 
 * Environment Setup:
 * - Set CLERK_JWT_ISSUER_DOMAIN in Convex dashboard (e.g., https://your-app.clerk.accounts.dev)
 * - Must match the issuer domain in your Clerk JWT template
 * - The applicationID "convex" must match the JWT template name in Clerk
 */
import type { AuthConfig } from "convex/server";

// Ensure the JWT issuer domain is configured before the app starts
if (!process.env.CLERK_JWT_ISSUER_DOMAIN) {
  throw new Error("CLERK_JWT_ISSUER_DOMAIN is not set");
}

export default {
  providers: [
    {
      // Clerk JWT issuer domain - this validates that tokens come from your Clerk instance
      // Configure this in the Convex dashboard under Settings > Environment Variables
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN as string,
      // Must match the JWT template name in Clerk (typically "convex")
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
