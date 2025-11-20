/**
 * useProjectRealtime Hook
 * 
 * Custom React hook for subscribing to real-time Inngest workflow updates.
 * Provides live status updates as podcast processing proceeds.
 * 
 * Real-time Architecture:
 * 1. Hook fetches subscription token from /api/realtime/token
 * 2. Establishes Server-Sent Events (SSE) connection to Inngest
 * 3. Receives published events from workflow (transcription start/done, generation start/done)
 * 4. Updates local state to trigger UI re-renders
 * 
 * Why Real-time Updates?
 * - Better UX: Users see progress without refreshing
 * - Reduces load: No polling required
 * - Instant feedback: Status updates as soon as workflow publishes
 * 
 * Fallback Strategy:
 * - Returns hasRealtimeUpdates flag to indicate if connection is active
 * - UI can fall back to Convex jobStatus if real-time fails
 * - Ensures UI always shows accurate status
 */
"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useCallback, useEffect, useState } from "react";
import { REALTIME_TOPICS } from "@/inngest/lib/realtime-topics";
import type { PhaseStatus } from "@/lib/types";

interface UseProjectRealtimeResult {
  transcriptionStatus: PhaseStatus; // Current transcription phase status
  generationStatus: PhaseStatus; // Current AI generation phase status
  hasRealtimeUpdates: boolean; // Whether real-time connection is active
}

/**
 * Subscribe to real-time updates for a project's processing workflow
 * 
 * @param projectId - Convex project ID to monitor
 * @returns Current phase statuses and connection state
 * 
 * Usage:
 * ```tsx
 * const { transcriptionStatus, generationStatus, hasRealtimeUpdates } = 
 *   useProjectRealtime(projectId);
 * 
 * // Show live status in UI
 * {transcriptionStatus === 'running' && <Spinner />}
 * 
 * // Fallback to Convex if real-time fails
 * {!hasRealtimeUpdates && <UseConvexJobStatus />}
 * ```
 */
export function useProjectRealtime(
  projectId: string,
): UseProjectRealtimeResult {
  // Phase status state
  const [transcriptionStatus, setTranscriptionStatus] =
    useState<PhaseStatus>("pending");
  const [generationStatus, setGenerationStatus] =
    useState<PhaseStatus>("pending");
  const [hasRealtimeUpdates, setHasRealtimeUpdates] = useState(false);
  
  // Deduplication: Track processed messages to avoid duplicate updates
  const [processedMessageIds] = useState(() => new Set<string>());

  /**
   * Fetch subscription token from API route
   * 
   * Token grants access to project's real-time channel.
   * Called by useInngestSubscription when establishing connection.
   */
  const fetchRealtimeToken = useCallback(async () => {
    console.log("🔑 Fetching Inngest realtime token for project:", projectId);
    const response = await fetch(`/api/realtime/token?projectId=${projectId}`);
    const data = await response.json();
    console.log("🔑 Token received:", data.token ? "✓" : "✗");
    return data.token;
  }, [projectId]);

  // Subscribe to Inngest real-time events
  const { data } = useInngestSubscription({
    refreshToken: fetchRealtimeToken,
  });

  /**
   * Process incoming real-time messages
   * 
   * Message Flow:
   * 1. Inngest workflow publishes event (e.g., transcription start)
   * 2. Message delivered via SSE to this hook
   * 3. Hook updates local state based on topic
   * 4. React re-renders with new status
   * 
   * Deduplication:
   * - Messages can arrive multiple times (network issues, reconnects)
   * - Track by messageId (topic + data) to process once
   */
  useEffect(() => {
    if (!data || data.length === 0) return;

    data.forEach(
      (message: { topic: string; data: Record<string, unknown> }) => {
        // Create unique message ID for deduplication
        const messageId = `${message.topic}-${JSON.stringify(message.data)}`;

        // Skip if already processed
        if (processedMessageIds.has(messageId)) {
          return;
        }

        processedMessageIds.add(messageId);
        setHasRealtimeUpdates(true); // Mark real-time as active
        console.log("📡 Inngest realtime message:", {
          topic: message.topic,
          data: message.data,
        });

        // Update status based on topic
        if (message.topic === REALTIME_TOPICS.TRANSCRIPTION_START) {
          console.log("🎤 Transcription started");
          setTranscriptionStatus("running");
        } else if (message.topic === REALTIME_TOPICS.TRANSCRIPTION_DONE) {
          console.log("✅ Transcription completed");
          setTranscriptionStatus("completed");
        } else if (message.topic === REALTIME_TOPICS.GENERATION_START) {
          console.log("🤖 AI Generation started (6 outputs)");
          setGenerationStatus("running");
        } else if (message.topic === REALTIME_TOPICS.GENERATION_DONE) {
          console.log("✅ AI Generation completed");
          setGenerationStatus("completed");
        }
      },
    );
  }, [data, processedMessageIds]);

  return {
    transcriptionStatus,
    generationStatus,
    hasRealtimeUpdates,
  };
}
