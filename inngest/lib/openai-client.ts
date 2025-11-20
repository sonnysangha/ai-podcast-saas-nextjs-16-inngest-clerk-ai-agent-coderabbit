/**
 * OpenAI Client Configuration
 * 
 * Centralized OpenAI client used by all AI generation steps.
 * 
 * Usage Pattern:
 * - Import this client in all AI generation functions
 * - Wrap calls with step.ai.wrap() for Inngest observability
 * - Use Structured Outputs (zodResponseFormat) for type-safe responses
 * 
 * Environment:
 * - Requires OPENAI_API_KEY environment variable
 * - Configure in Vercel/Inngest dashboard
 * 
 * Models Used:
 * - gpt-5-mini: Fast and cost-effective for content generation
 * - Can be swapped to gpt-4 for higher quality if needed
 */
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
