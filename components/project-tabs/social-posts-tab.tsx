"use client";

import { Protect } from "@clerk/nextjs";
import { generateMissingFeatures } from "@/app/actions/generate-missing-features";
import { ErrorRetryCard } from "@/components/project-detail/error-retry-card";
import { UpgradePrompt } from "@/components/project-detail/upgrade-prompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Id } from "@/convex/_generated/dataModel";
import { FEATURES } from "@/lib/tier-config";
import { Check, Copy, Sparkles } from "lucide-react";
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
  const [isGenerating, setIsGenerating] = useState(false);

  if (error) {
    return (
      <ErrorRetryCard
        projectId={projectId}
        job="socialPosts"
        errorMessage={error}
      />
    );
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateMissingFeatures(projectId);
      toast.success(result.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate features",
      );
      setIsGenerating(false);
    }
  };

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
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <p className="text-muted-foreground">No social posts available</p>
            <p className="text-sm text-muted-foreground">
              It looks like this project was processed before you upgraded.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate All Missing Features"}
            </Button>
            <p className="text-xs text-muted-foreground">
              This will generate all features available in your current plan
            </p>
          </CardContent>
        </Card>
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
      <div className="grid gap-4 md:grid-cols-2">
        {PLATFORMS.map((platform) => (
          <Card
            key={platform.key}
            className={`transition-all ${platform.bgColor} border-2 hover:shadow-md`}
          >
            <CardContent className="p-6">
              {/* Header with Icon and Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className="shrink-0">
                  <SocialIcon
                    url={platform.url}
                    style={{ height: 48, width: 48 }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1">
                    {platform.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">Ready to post</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleCopy(platform.title, socialPosts[platform.key])
                  }
                  className="shrink-0"
                >
                  {copiedPlatform === platform.title ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              {/* Post Content */}
              <div className="relative">
                <div className="rounded-lg bg-white p-4 text-sm border">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {socialPosts[platform.key]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Protect>
  );
}
