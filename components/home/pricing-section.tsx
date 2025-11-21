import { PricingTable } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

interface PricingSectionProps {
  compact?: boolean;
}

export function PricingSection({ compact = false }: PricingSectionProps) {
  return (
    <section className="container mx-auto px-4 py-20 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        {/* Pricing Table */}
        <div className="flex justify-center w-full">
          <div className={compact ? "max-w-4xl w-full" : "max-w-5xl w-full"}>
            <PricingTable
              appearance={{
                elements: {
                  pricingTableCardHeader: {
                    background: "linear-gradient(135deg, oklch(0.205 0 0), oklch(0.269 0 0))",
                    color: "white",
                    borderRadius: "0.625rem 0.625rem 0 0",
                  },
                  pricingTableCardTitle: {
                    fontSize: compact ? "1.5rem" : "2rem",
                    fontWeight: "700",
                    color: "white",
                  },
                  pricingTableCardDescription: {
                    fontSize: compact ? "0.875rem" : "1rem",
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
                    padding: compact ? "1.5rem" : "2rem",
                  },
                  pricingTableCardFeatures: {
                    marginTop: "1.5rem",
                  },
                  pricingTableCardFeature: {
                    fontSize: compact ? "0.875rem" : "1rem",
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
              fallback={
                <div className="flex items-center justify-center py-20">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Loading pricing options...</p>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}

