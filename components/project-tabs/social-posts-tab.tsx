"use client";

import { Protect } from "@clerk/nextjs";
import { ErrorRetryCard } from "@/components/project-detail/error-retry-card";
import { GenerateMissingCard } from "@/components/project-detail/generate-missing-card";
import { UpgradePrompt } from "@/components/project-detail/upgrade-prompt";
import { Button } from "@/components/ui/button";
import type { Id } from "@/convex/_generated/dataModel";
import { FEATURES } from "@/lib/tier-config";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { SocialIcon } from "react-social-icons";
import { toast } from "sonner";

interface SocialPostsTabProps {
  projectId: Id<"projects">;
  socialPosts?: {
    twitter: string;
    linkedin: string;
    instagram: string;
    tiktok: string;
    youtube: string;
    facebook: string;
  };
  error?: string;
}

const PLATFORMS = [
  {
    key: "twitter" as const,
    title: "Twitter / X",
    url: "https://twitter.com",
    bgColor: "bg-black/5",
    hoverColor: "hover:bg-black/10",
  },
  {
    key: "linkedin" as const,
    title: "LinkedIn",
    url: "https://linkedin.com",
    bgColor: "bg-blue-50",
    hoverColor: "hover:bg-blue-100",
  },
  {
    key: "instagram" as const,
    title: "Instagram",
    url: "https://instagram.com",
    bgColor: "bg-pink-50",
    hoverColor: "hover:bg-pink-100",
  },
  {
    key: "tiktok" as const,
    title: "TikTok",
    url: "https://tiktok.com",
    bgColor: "bg-slate-50",
    hoverColor: "hover:bg-slate-100",
  },
  {
    key: "youtube" as const,
    title: "YouTube",
    url: "https://youtube.com",
    bgColor: "bg-red-50",
    hoverColor: "hover:bg-red-100",
  },
  {
    key: "facebook" as const,
    title: "Facebook",
    url: "https://facebook.com",
    bgColor: "bg-blue-50",
    hoverColor: "hover:bg-blue-100",
  },
];

export function SocialPostsTab({
  projectId,
  socialPosts,
  error,
}: SocialPostsTabProps) {
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

  if (error) {
    return (
      <ErrorRetryCard
        projectId={projectId}
        job="socialPosts"
        errorMessage={error}
      />
    );
  }

  if (!socialPosts) {
    return (
      <Protect
        feature={FEATURES.SOCIAL_POSTS}
        fallback={
          <UpgradePrompt
            feature="Social Posts"
            featureKey={FEATURES.SOCIAL_POSTS}
            currentPlan="free"
          />
        }
      >
        <GenerateMissingCard
          projectId={projectId}
          message="No social posts available"
        />
      </Protect>
    );
  }

  const handleCopy = async (platform: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedPlatform(platform);
    toast.success(`${platform} post copied to clipboard!`);
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  return (
    <Protect
      feature={FEATURES.SOCIAL_POSTS}
      fallback={
        <UpgradePrompt
          feature="Social Posts"
          featureKey={FEATURES.SOCIAL_POSTS}
          currentPlan="free"
        />
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        {PLATFORMS.map((platform) => (
          <div
            key={platform.key}
            className={`glass-card rounded-2xl p-4 md:p-6 ${platform.bgColor}`}
          >
            {/* Header with Icon and Title */}
            <div className="flex items-start gap-3 md:gap-5 mb-4 md:mb-6">
              <div className="shrink-0">
                <SocialIcon
                  url={platform.url}
                  style={{ height: 48, width: 48 }}
                  className="md:h-14 md:w-14"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base md:text-xl mb-1 break-words">
                  {platform.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-600">
                  Ready to post
                </p>
              </div>
              <Button
                size="sm"
                onClick={() =>
                  handleCopy(platform.title, socialPosts[platform.key])
                }
                className="shrink-0 gradient-emerald text-white shadow-md text-xs md:text-sm"
              >
                {copiedPlatform === platform.title ? (
                  <>
                    <Check className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {/* Post Content */}
            <div className="relative">
              <div className="rounded-xl bg-white p-4 md:p-5 text-xs md:text-sm border-2 shadow-sm">
                <p className="whitespace-pre-wrap leading-relaxed text-gray-700 break-words">
                  {socialPosts[platform.key]}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Protect>
  );
}
