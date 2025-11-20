/**
 * Zod Schemas for AI-Generated Content
 * 
 * These schemas enforce structure for OpenAI Structured Outputs, ensuring:
 * - Type safety: Generated content matches our TypeScript types
 * - Validation: OpenAI's responses conform to our expected format
 * - Descriptions: Guide GPT on what to generate (used in prompt construction)
 * 
 * OpenAI Structured Outputs Flow:
 * 1. Define Zod schema with .describe() hints for GPT
 * 2. Pass schema to zodResponseFormat() in OpenAI API call
 * 3. OpenAI returns JSON matching the schema (no parsing errors!)
 * 4. Parse with schema.parse() for TypeScript types
 * 
 * Design Decision: Zod over TypeScript types alone
 * - Runtime validation (catches API changes or malformed responses)
 * - Self-documenting schemas (descriptions guide both GPT and developers)
 * - Automatic type inference (no duplicate type definitions)
 */
import { z } from "zod";

/**
 * Summary Schema - Multi-format podcast overview
 * 
 * Provides different summary lengths for various use cases:
 * - full: Detailed overview for blog posts or show notes
 * - bullets: Scannable list for quick reference
 * - insights: Actionable takeaways for the audience
 * - tldr: Hook for social media or email subject lines
 */
export const summarySchema = z.object({
  full: z.string().describe("Comprehensive overview (200-300 words)"),
  bullets: z
    .array(z.string())
    .min(5)
    .max(7)
    .describe("5-7 key bullet points covering main topics"),
  insights: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe("3-5 actionable insights or takeaways"),
  tldr: z.string().describe("One-sentence summary"),
});

export type Summary = z.infer<typeof summarySchema>;

/**
 * Titles Schema - Context-specific title suggestions
 * 
 * Different title formats optimized for:
 * - youtubeShort: Clickable, emotional hooks (40-60 chars)
 * - youtubeLong: SEO-optimized with keywords (70-100 chars)
 * - podcastTitles: Episode titles for podcast feeds
 * - seoKeywords: Discoverability across search engines
 */
export const titlesSchema = z.object({
  youtubeShort: z
    .array(z.string())
    .length(3)
    .describe("3 YouTube short titles (40-60 chars, hook-focused)"),
  youtubeLong: z
    .array(z.string())
    .length(3)
    .describe("3 YouTube long titles (70-100 chars, SEO keywords)"),
  podcastTitles: z
    .array(z.string())
    .length(3)
    .describe("3 podcast episode titles (creative + descriptive)"),
  seoKeywords: z
    .array(z.string())
    .min(5)
    .max(10)
    .describe("5-10 SEO keywords for discoverability"),
});

export type Titles = z.infer<typeof titlesSchema>;

/**
 * Social Posts Schema - Platform-optimized content
 * 
 * Each platform has unique characteristics:
 * - twitter: 280 char limit, punchy and quotable
 * - linkedin: Professional tone, longer-form acceptable
 * - instagram: Visual-first, emoji-rich, storytelling
 * - tiktok: Gen Z voice, casual, trend-aware
 * - youtube: Detailed descriptions with timestamps and CTAs
 * - facebook: Community-focused, conversation starters
 */
export const socialPostsSchema = z.object({
  twitter: z.string().max(280).describe("Twitter/X post (280 chars max)"),
  linkedin: z
    .string()
    .describe("LinkedIn post (professional tone, 1-2 paragraphs)"),
  instagram: z.string().describe("Instagram caption (engaging, emoji-rich)"),
  tiktok: z.string().describe("TikTok caption (Gen Z tone, short)"),
  youtube: z.string().describe("YouTube description (detailed, timestamps)"),
  facebook: z.string().describe("Facebook post (conversational, shareable)"),
});

export type SocialPosts = z.infer<typeof socialPostsSchema>;

/**
 * Hashtags Schema - Platform-specific discovery tags
 * 
 * Hashtag strategies vary by platform:
 * - youtube: Broader reach (lower competition)
 * - instagram: Mix of niche + broad (6-8 is optimal)
 * - tiktok: Trending tags (refresh frequently)
 * - linkedin: Professional keywords (lower usage than Instagram/TikTok)
 * - twitter: Concise, recognizable tags
 */
export const hashtagsSchema = z.object({
  youtube: z
    .array(z.string())
    .length(5)
    .describe("5 YouTube hashtags (broad reach)"),
  instagram: z
    .array(z.string())
    .min(6)
    .max(8)
    .describe("6-8 Instagram hashtags (mix of niche + broad)"),
  tiktok: z
    .array(z.string())
    .min(5)
    .max(6)
    .describe("5-6 TikTok hashtags (trending)"),
  linkedin: z
    .array(z.string())
    .length(5)
    .describe("5 LinkedIn hashtags (professional)"),
  twitter: z
    .array(z.string())
    .length(5)
    .describe("5 Twitter hashtags (concise)"),
});

export type Hashtags = z.infer<typeof hashtagsSchema>;

