/**
 * API Utilities for Next.js Route Handlers
 * 
 * Standard helpers for authentication, responses, and error handling in API routes.
 * These utilities ensure consistent behavior and error formats across all endpoints.
 * 
 * Why These Helpers?
 * - Standardizes response format across all API routes
 * - Centralizes authentication logic
 * - Provides type-safe error handling
 * - Reduces boilerplate in route handlers
 */
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Standardized API success response helper
 * 
 * Returns NextResponse with JSON data and optional status code.
 * Default status is 200 (OK).
 * 
 * @param data - Response payload (any type)
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with JSON body
 */
export function apiResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Standardized API error response helper
 * 
 * Returns NextResponse with error message and status code.
 * Format: { error: string }
 * 
 * @param message - Error message for client
 * @param status - HTTP status code (default: 500)
 * @returns NextResponse with error body
 */
export function apiError(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Authentication wrapper for API routes
 * 
 * Validates Clerk authentication and returns userId if authenticated.
 * Throws NextResponse with 401 if not authenticated (caught by route handler).
 * 
 * Usage Pattern:
 * ```ts
 * export async function GET(request: Request) {
 *   try {
 *     const { userId } = await withAuth(); // Throws if not authenticated
 *     // ... protected route logic
 *   } catch (error) {
 *     if (error instanceof NextResponse) return error; // Auth error
 *     // ... other error handling
 *   }
 * }
 * ```
 * 
 * Design Decision: Throw NextResponse vs. return undefined
 * - Throwing allows early exit (no nested if statements)
 * - Type system knows userId is defined after withAuth()
 * - Consistent error format (same apiError helper)
 * 
 * @returns Object with userId
 * @throws NextResponse with 401 if not authenticated
 */
export async function withAuth(): Promise<{ userId: string }> {
  const { userId } = await auth();
  if (!userId) {
    throw apiError("Unauthorized", 401);
  }
  return { userId };
}
