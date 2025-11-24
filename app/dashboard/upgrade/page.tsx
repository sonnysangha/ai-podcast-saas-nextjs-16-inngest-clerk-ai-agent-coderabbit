/**
 * Upgrade Page
 *
 * Displays pricing table with contextual messaging based on why user is upgrading.
 * Uses Clerk's PricingTable component to handle subscriptions.
 *
 * Query Parameters:
 * - reason: file_size | duration | projects | feature
 * - feature: (optional) specific feature name if reason=feature
 *
 * Examples:
 * - /dashboard/upgrade?reason=file_size
 * - /dashboard/upgrade?reason=projects
 * - /dashboard/upgrade?reason=feature
 */

import { PricingTable } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Lock, Zap, Crown } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface UpgradePageProps {
  searchParams: {
    reason?: string;
    feature?: string;
  };
}

/**
 * Get contextual messaging based on upgrade reason
 */
function getUpgradeMessage(reason?: string, feature?: string) {
  switch (reason) {
    case "file_size":
      return {
        title: "Upgrade for Larger Files",
        description:
          "Your file exceeds your plan's size limit. Upgrade to Pro for 200MB uploads or Ultra for 3GB uploads.",
        icon: Zap,
      };
    case "duration":
      return {
        title: "Upgrade for Longer Podcasts",
        description:
          "Your podcast exceeds your plan's duration limit. Upgrade to Pro for 2-hour podcasts or Ultra for unlimited duration.",
        icon: Zap,
      };
    case "projects":
      return {
        title: "You've Reached Your Project Limit",
        description:
          "Upgrade to create more projects. Pro: 30 projects, Ultra: unlimited projects.",
        icon: Lock,
      };
    case "feature":
      return {
        title: `Unlock ${feature || "Premium Features"}`,
        description:
          "Access advanced AI features like social posts, YouTube timestamps, and key moments by upgrading your plan.",
        icon: Lock,
      };
    default:
      return {
        title: "Upgrade Your Plan",
        description:
          "Get access to more projects, larger files, and advanced AI features.",
        icon: Zap,
      };
  }
}

/**
 * Detect current plan using Clerk's has() method
 */
function getCurrentPlan(authObj: Awaited<ReturnType<typeof auth>>) {
  const { has } = authObj;
  if (has?.({ plan: "ultra" })) return "ultra";
  if (has?.({ plan: "pro" })) return "pro";
  return "free";
}

export default async function UpgradePage({ searchParams }: UpgradePageProps) {
  const { reason, feature } = searchParams;
  const message = getUpgradeMessage(reason, feature);
  const Icon = message.icon;

  const authObj = await auth();
  const currentPlan = getCurrentPlan(authObj);

  return (
    <div className="min-h-screen mesh-background-subtle">
      {/* Header */}
      <div className="glass-nav border-b">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Contextual Message */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
            <Icon className="h-10 w-10 text-gray-700" />
          </div>
          <h1 className="text-5xl font-extrabold mb-6">
            <span className="gradient-emerald-text">{message.title}</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            {message.description}
          </p>

          {/* Current Plan Badge */}
          <div className="flex items-center justify-center gap-2 text-base text-gray-600">
            <span>Current plan:</span>
            <Badge
              className={
                currentPlan === "ultra"
                  ? "gradient-emerald text-white px-4 py-1.5"
                  : "bg-gray-200 text-gray-700 px-4 py-1.5"
              }
            >
              {currentPlan === "ultra" && <Crown className="h-4 w-4 mr-1" />}
              {currentPlan === "free" && "Free"}
              {currentPlan === "pro" && "Pro"}
              {currentPlan === "ultra" && "Ultra"}
            </Badge>
          </div>
        </div>

        {/* Pricing Table */}
        <div className="max-w-6xl mx-auto">
          <PricingTable
            appearance={{
              elements: {
                pricingTableCardHeader: {
                  background:
                    "linear-gradient(135deg, rgb(16 185 129), rgb(45 212 191))",
                  color: "white",
                  borderRadius: "1rem 1rem 0 0",
                  padding: "2.5rem",
                },
                pricingTableCardTitle: {
                  fontSize: "2.25rem",
                  fontWeight: "800",
                  color: "white",
                  marginBottom: "0.5rem",
                },
                pricingTableCardDescription: {
                  fontSize: "1.1rem",
                  color: "rgba(255, 255, 255, 0.95)",
                  fontWeight: "500",
                },
                pricingTableCardFee: {
                  color: "white",
                  fontWeight: "800",
                  fontSize: "3rem",
                },
                pricingTableCardFeePeriod: {
                  color: "rgba(255, 255, 255, 0.85)",
                  fontSize: "1.1rem",
                },
                pricingTableCard: {
                  borderRadius: "1rem",
                  border: "2px solid rgb(16 185 129 / 0.2)",
                  boxShadow: "0 10px 40px rgba(16, 185, 129, 0.15)",
                  transition: "all 0.3s ease",
                  overflow: "hidden",
                  background: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(10px)",
                },
                pricingTableCardBody: {
                  padding: "2.5rem",
                },
                pricingTableCardFeatures: {
                  marginTop: "2rem",
                  gap: "1rem",
                },
                pricingTableCardFeature: {
                  fontSize: "1.05rem",
                  padding: "0.75rem 0",
                  fontWeight: "500",
                },
                pricingTableCardButton: {
                  marginTop: "2rem",
                  borderRadius: "0.75rem",
                  fontWeight: "700",
                  padding: "1rem 2.5rem",
                  transition: "all 0.2s ease",
                  fontSize: "1.1rem",
                  background:
                    "linear-gradient(135deg, rgb(16 185 129), rgb(45 212 191))",
                  border: "none",
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
