import { inngest } from "@/inngest/client";

export const testRealtime = inngest.createFunction(
  { id: "test-realtime" },
  { event: "test/realtime" },
  async ({ event, step, publish }) => {
    const { userId } = event.data;

    console.log("🧪 Test function started, userId:", userId);

    // Publish a start message
    await publish({
      channel: `user:${userId}`,
      topic: "test",
      data: {
        message: "Test started",
        timestamp: Date.now(),
      },
    });
    console.log("🧪 Published start message");

    // Wait 2 seconds
    await step.sleep("wait-2s", "2s");

    // Publish another message
    await publish({
      channel: `user:${userId}`,
      topic: "test",
      data: {
        message: "After 2 seconds",
        timestamp: Date.now(),
      },
    });
    console.log("🧪 Published second message");

    // Wait 2 more seconds
    await step.sleep("wait-4s", "2s");

    // Publish final message
    await publish({
      channel: `user:${userId}`,
      topic: "test",
      data: {
        message: "Test completed!",
        timestamp: Date.now(),
      },
    });
    console.log("🧪 Published final message");

    return { success: true };
  }
);
