"use client";

import { TabSkeleton } from "./tab-skeleton";

interface TabContentProps {
  isLoading: boolean;
  data: unknown;
  error?: string;
  children: React.ReactNode;
}

export function TabContent({
  isLoading,
  data,
  error,
  children,
}: TabContentProps) {
  if (isLoading) {
    return <TabSkeleton />;
  }

  // Always render children to allow upgrade prompts to show
  // The child component will handle the logic for:
  // - Locked features (show upgrade prompt)
  // - No data (show empty state)
  // - Errors (show error card)
  return <>{children}</>;
}
