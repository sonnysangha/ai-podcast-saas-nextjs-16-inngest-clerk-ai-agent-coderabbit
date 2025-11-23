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
import { ArrowLeft, Lock, Zap } from "lucide-react";
import Link from "next/link";

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

export default async function UpgradePage({ searchParams }: UpgradePageProps) {
  const { reason, feature } = searchParams;
  const message = getUpgradeMessage(reason, feature);
  const Icon = message.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Contextual Message */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">{message.title}</h1>
          <p className="text-xl text-muted-foreground">{message.description}</p>
        </div>

        {/* Pricing Table */}
        <div className="max-w-6xl mx-auto">
          <PricingTable
            appearance={{
              elements: {
                pricingTableCardHeader: {
                  background:
                    "linear-gradient(135deg, oklch(0.205 0 0), oklch(0.269 0 0))",
                  color: "white",
                  borderRadius: "0.625rem 0.625rem 0 0",
                },
                pricingTableCardTitle: {
                  fontSize: "2rem",
                  fontWeight: "700",
                  color: "white",
                },
                pricingTableCardDescription: {
                  fontSize: "1rem",
                  color: "rgba(255, 255, 255, 0.9)",
                },
                pricingTableCardFee: {
                  color: "white",
                  fontWeight: "700",
                },
                pricingTableCardFeePeriod: {
                  color: "rgba(255, 255, 255, 0.8)",
                },
                pricingTableCard: {
                  borderRadius: "0.625rem",
                  border: "1px solid oklch(0.922 0 0)",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  transition: "all 0.3s ease",
                },
                pricingTableCardBody: {
                  padding: "2rem",
                },
                pricingTableCardFeatures: {
                  marginTop: "1.5rem",
                },
                pricingTableCardFeature: {
                  fontSize: "1rem",
                  padding: "0.5rem 0",
                },
                pricingTableCardButton: {
                  marginTop: "2rem",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  padding: "0.75rem 2rem",
                  transition: "all 0.2s ease",
                },
              },
            }}
          />
        </div>

        {/* Benefits Summary */}
        <div className="max-w-3xl mx-auto mt-16 text-center">
          <h2 className="text-2xl font-bold mb-6">Why Upgrade?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 border rounded-lg">
              <h3 className="font-semibold mb-2">More Projects</h3>
              <p className="text-sm text-muted-foreground">
                Create up to 30 projects with Pro or unlimited with Ultra
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="font-semibold mb-2">Larger Files</h3>
              <p className="text-sm text-muted-foreground">
                Upload files up to 200MB (Pro) or 3GB (Ultra)
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="font-semibold mb-2">Advanced AI</h3>
              <p className="text-sm text-muted-foreground">
                Access social posts, YouTube timestamps, and key moments
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

