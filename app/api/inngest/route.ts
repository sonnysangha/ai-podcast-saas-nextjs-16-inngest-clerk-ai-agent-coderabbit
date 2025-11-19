import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { podcastProcessor } from "../../../inngest/functions/podcast-processor";
import { testRealtime } from "../../../inngest/functions/test-realtime";

export const dynamic = "force-dynamic";

// Create an API that serves all Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [podcastProcessor, testRealtime],
});
