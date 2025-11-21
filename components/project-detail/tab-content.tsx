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

  // Show children if there's data OR if there's an error (error card needs to render)
  if (!data && !error) {
    return null;
  }

  return <>{children}</>;
}
