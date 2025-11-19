import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getSubscriptionToken } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { REALTIME_TOPICS } from "@/inngest/lib/realtime-topics";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

export async function GET(request: Request) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get project ID from query params
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") as Id<"projects"> | null;

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    // Verify user owns this project
    const project = await convex.query(api.projects.getProject, { projectId });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate Inngest Realtime subscription token
    // Scoped to this specific project channel
    // Subscribe to only our 4 phase topics
    const channelName = `project:${projectId}`;
    console.log("🎫 Generating subscription token for channel:", channelName);

    const topics = [
      REALTIME_TOPICS.TRANSCRIPTION_START,
      REALTIME_TOPICS.TRANSCRIPTION_DONE,
      REALTIME_TOPICS.GENERATION_START,
      REALTIME_TOPICS.GENERATION_DONE,
    ];

    console.log("🎫 Subscribing to topics:", topics);

    const token = await getSubscriptionToken(inngest, {
      channel: channelName,
      topics,
    });

    console.log("🎫 Token generated successfully for channel:", channelName);
    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating subscription token:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate subscription token",
      },
      { status: 500 }
    );
  }
}
