import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { auth } from "@clerk/nextjs/server";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🚀 Sending test event for user:", userId);

    // Send the test event
    await inngest.send({
      name: "test/realtime",
      data: { userId },
    });

    console.log("🚀 Test event sent successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending test event:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to send test event",
      },
      { status: 500 }
    );
  }
}
