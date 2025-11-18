import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { TranscriptWithExtras } from "../../types/assemblyai";
import { summarySchema, type Summary } from "../../schemas/ai-outputs";
import { openai } from "../../lib/openai-client";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  publishStepStart,
  publishStepComplete,
  publishResult,
  type PublishFunction,
} from "../../lib/realtime";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

const SUMMARY_SYSTEM_PROMPT =
  "You are an expert podcast content analyst and marketing strategist. Your summaries are engaging, insightful, and highlight the most valuable takeaways for listeners.";

function buildSummaryPrompt(transcript: TranscriptWithExtras): string {
  return `Analyze this podcast transcript in detail and create a comprehensive summary package.

TRANSCRIPT (first 3000 chars):
${transcript.text.substring(0, 3000)}...

${
  transcript.chapters.length > 0
    ? `\nAUTO-DETECTED CHAPTERS:\n${transcript.chapters
        .map((ch, idx) => `${idx + 1}. ${ch.headline} - ${ch.summary}`)
        .join("\n")}`
    : ""
}

Create a summary with:

1. FULL OVERVIEW (200-300 words):
   - What is this podcast about?
   - Who is speaking and what's their perspective?
   - What are the main themes and arguments?
   - Why should someone listen to this?

2. KEY BULLET POINTS (5-7 items):
   - Main topics discussed in order
   - Important facts or statistics mentioned
   - Key arguments or positions taken
   - Notable quotes or moments

3. ACTIONABLE INSIGHTS (3-5 items):
   - What can listeners learn or apply?
   - Key takeaways that provide value
   - Perspectives that challenge conventional thinking
   - Practical advice or recommendations

4. TL;DR (one compelling sentence):
   - Capture the essence and hook interest
   - Make someone want to listen

Be specific, engaging, and valuable. Focus on what makes this podcast unique and worth listening to.`;
}

export async function generateSummary(
  transcript: TranscriptWithExtras,
  projectId: Id<"projects">,
  publish: PublishFunction
): Promise<Summary> {
  await convex.mutation(api.projects.updateJobStatus, {
    projectId,
    job: "summary",
    status: "running",
  });

  await publishStepStart(
    publish,
    projectId,
    "summary",
    "Generating intelligent summary with GPT-4...",
    40
  );

  console.log("Generating podcast summary with GPT-4");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: SUMMARY_SYSTEM_PROMPT },
        { role: "user", content: buildSummaryPrompt(transcript) },
      ],
      response_format: zodResponseFormat(summarySchema, "summary"),
    });

    const content = completion.choices[0]?.message?.content;
    const summary = content
      ? summarySchema.parse(JSON.parse(content))
      : {
          full: transcript.text.substring(0, 500),
          bullets: ["Full transcript available"],
          insights: ["See transcript"],
          tldr: transcript.text.substring(0, 200),
        };

    await convex.mutation(api.projects.updateJobStatus, {
      projectId,
      job: "summary",
      status: "completed",
    });

    await publishResult(publish, projectId, "summary", summary);

    return summary;
  } catch (error) {
    console.error("GPT summary generation error:", error);

    await convex.mutation(api.projects.updateJobStatus, {
      projectId,
      job: "summary",
      status: "failed",
    });

    return {
      full: "⚠️ Error generating summary with GPT-4. Please check logs or try again.",
      bullets: ["Summary generation failed - see full transcript"],
      insights: ["Error occurred during AI generation"],
      tldr: "Summary generation failed",
    };
  }
}
