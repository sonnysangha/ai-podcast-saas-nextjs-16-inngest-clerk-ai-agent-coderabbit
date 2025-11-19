import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSubscriptionToken } from "@inngest/realtime";
import { inngest } from "@/inngest/client";

export async function GET() {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🎫 Generating test subscription token for user:", userId);

    // Generate Inngest Realtime subscription token for test channel
    const token = await getSubscriptionToken(inngest, {
      channel: `user:${userId}`,
      topics: ["test"],
    });

    console.log("🎫 Test token generated successfully");
    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating test token:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate test token",
      },
      { status: 500 }
    );
  }
}
