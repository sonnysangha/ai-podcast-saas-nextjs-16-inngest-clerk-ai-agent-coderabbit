import { PricingTable } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

interface PricingSectionProps {
  compact?: boolean;
}

export function PricingSection({ compact = false }: PricingSectionProps) {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 mesh-background-subtle"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Simple, <span className="gradient-emerald-text">Transparent</span> Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
                      background: "linear-gradient(135deg, rgb(16 185 129), rgb(45 212 191))",
                      color: "white",
                      borderRadius: "1rem 1rem 0 0",
                      padding: compact ? "2rem" : "2.5rem",
                    },
                    pricingTableCardTitle: {
                      fontSize: compact ? "1.75rem" : "2.25rem",
                      fontWeight: "800",
                      color: "white",
                      marginBottom: "0.5rem",
                    },
                    pricingTableCardDescription: {
                      fontSize: compact ? "0.95rem" : "1.1rem",
                      color: "rgba(255, 255, 255, 0.95)",
                      fontWeight: "500",
                    },
                    pricingTableCardFee: {
                      color: "white",
                      fontWeight: "800",
                      fontSize: compact ? "2.5rem" : "3rem",
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
                      padding: compact ? "2rem" : "2.5rem",
                    },
                    pricingTableCardFeatures: {
                      marginTop: "2rem",
                      gap: "1rem",
                    },
                    pricingTableCardFeature: {
                      fontSize: compact ? "0.95rem" : "1.05rem",
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
                      background: "linear-gradient(135deg, rgb(16 185 129), rgb(45 212 191))",
                      border: "none",
                      boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                    },
                  },
                }}
                fallback={
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center space-y-4 glass-card p-12 rounded-2xl">
                      <Loader2 className="h-16 w-16 animate-spin text-emerald-600 mx-auto" />
                      <p className="text-gray-600 text-lg font-medium">Loading pricing options...</p>
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

