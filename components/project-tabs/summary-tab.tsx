"use client";

import { ErrorRetryCard } from "@/components/project-detail/error-retry-card";
import type { Id } from "@/convex/_generated/dataModel";

interface SummaryTabProps {
  projectId: Id<"projects">;
  summary?: {
    tldr: string;
    full: string;
    bullets: string[];
    insights: string[];
  };
  error?: string;
}

export function SummaryTab({ projectId, summary, error }: SummaryTabProps) {
  if (error) {
    return (
      <ErrorRetryCard
        projectId={projectId}
        job="summary"
        errorMessage={error}
      />
    );
  }

  if (!summary) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <p className="text-gray-500 text-lg">No summary available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-8">
        <h3 className="text-2xl font-bold mb-4 gradient-emerald-text">TL;DR</h3>
        <p className="text-lg text-gray-700 leading-relaxed break-words">
          {summary.tldr}
        </p>
      </div>

      <div className="glass-card rounded-2xl p-8">
        <h3 className="text-2xl font-bold mb-4 gradient-emerald-text">
          Full Summary
        </h3>
        <p className="text-gray-700 leading-relaxed break-words">
          {summary.full}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Key Points */}
        <div className="glass-card rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-6 text-gray-900">Key Points</h3>
          <ul className="space-y-3">
            {summary.bullets.map((bullet, idx) => (
              <li
                key={`${idx}-${bullet}`}
                className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100"
              >
                <span className="text-gray-700 leading-relaxed break-words">
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Insights */}
        <div className="glass-card rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-6 text-gray-900">Insights</h3>
          <ul className="space-y-3">
            {summary.insights.map((insight, idx) => (
              <li
                key={`${idx}-${insight}`}
                className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100"
              >
                <span className="text-gray-700 leading-relaxed break-words">
                  {insight}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
