"use client";

import { useCallback, useState } from "react";
import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useAuth } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function RealtimeTest() {
  const { userId } = useAuth();
  const [messages, setMessages] = useState<string[]>([]);

  // Fetch subscription token
  const fetchToken = useCallback(async () => {
    console.log("🔑 Fetching test token...");
    const response = await fetch("/api/realtime/test-token");
    const data = await response.json();
    console.log("🔑 Test token received:", data.token ? "✓" : "✗");
    return data.token;
  }, []);

  // Subscribe to test channel
  const { data, error, state } = useInngestSubscription({
    refreshToken: fetchToken,
  });

  console.log("🔄 Subscription state:", state);
  console.log("🔄 Messages received:", data.length);
  console.log("🔄 Error:", error);

  // Trigger test function
  const runTest = async () => {
    if (!userId) return;

    setMessages([]);
    console.log("🚀 Triggering test function...");

    const response = await fetch("/api/test/trigger", {
      method: "POST",
    });

    const result = await response.json();
    console.log("🚀 Test function triggered:", result);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Inngest Realtime Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Subscription State: <span className="font-mono">{state}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Messages Received:{" "}
              <span className="font-mono">{data.length}</span>
            </p>
            {error && (
              <p className="text-sm text-destructive">Error: {error.message}</p>
            )}
          </div>
          <Button onClick={runTest} disabled={!userId}>
            Run Test
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Messages:</h3>
          <div className="border rounded-lg p-4 space-y-2 min-h-[200px] max-h-[400px] overflow-y-auto">
            {data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No messages yet. Click "Run Test" to start.
              </p>
            ) : (
              data.map((msg, i) => (
                <div key={i} className="border-b pb-2">
                  <p className="text-sm font-mono">
                    {JSON.stringify(msg.data, null, 2)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
