"use client";

import { SignInButton, UserButton, useAuth, Protect } from "@clerk/nextjs";
import { Home, Sparkles, Zap, Crown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const showDashboardNav = isDashboard;

  return (
    <header
      className={
        isDashboard
          ? "gradient-emerald sticky top-0 transition-all shadow-xl backdrop-blur-sm z-50 border-b border-white/10"
          : "glass-nav sticky top-0 transition-all z-50 backdrop-blur-md border-b border-gray-200/50 shadow-sm"
      }
    >
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 lg:gap-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 hover:opacity-90 transition-all duration-300 group"
            >
              <div
                className={
                  isDashboard
                    ? "p-2 rounded-xl bg-white/95 group-hover:bg-white group-hover:scale-110 group-hover:shadow-xl transition-all duration-300"
                    : "p-2 rounded-xl gradient-emerald group-hover:scale-110 group-hover:shadow-xl transition-all duration-300"
                }
              >
                <Sparkles
                  className={
                    isDashboard
                      ? "h-5 w-5 text-emerald-600 group-hover:rotate-12 transition-transform duration-300"
                      : "h-5 w-5 text-white group-hover:rotate-12 transition-transform duration-300"
                  }
                />
              </div>
              <span
                className={
                  isDashboard
                    ? "text-xl font-bold text-white tracking-tight"
                    : "text-xl font-bold gradient-emerald-text tracking-tight"
                }
              >
                Podassi
              </span>
            </Link>

            {/* Dashboard Navigation inline with logo */}
            {showDashboardNav && (
              <div className="flex items-center pl-2 sm:pl-4 border-l border-white/20">
                <DashboardNav />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            {isSignedIn ? (
              <>
                {/* Show "Upgrade to Pro" for Free users */}
                <Protect
                  condition={(has) =>
                    !has({ plan: "pro" }) && !has({ plan: "ultra" })
                  }
                  fallback={null}
                >
                  <Link href="/dashboard/upgrade">
                    <Button
                      className={
                        isDashboard
                          ? "bg-white/95 text-emerald-600 hover:bg-white hover:scale-105 gap-2 shadow-lg font-semibold transition-all duration-300 border border-white/20"
                          : "gradient-emerald text-white hover-glow hover:scale-105 gap-2 shadow-lg transition-all duration-300"
                      }
                    >
                      <Zap className="h-4 w-4" />
                      <span className="hidden lg:inline">Upgrade to Pro</span>
                      <span className="lg:hidden">Pro</span>
                    </Button>
                  </Link>
                </Protect>

                {/* Show "Upgrade to Ultra" for Pro users */}
                <Protect
                  condition={(has) =>
                    has({ plan: "pro" }) && !has({ plan: "ultra" })
                  }
                  fallback={null}
                >
                  <Link href="/dashboard/upgrade">
                    <Button
                      className={
                        isDashboard
                          ? "bg-white/95 text-emerald-600 hover:bg-white hover:scale-105 gap-2 shadow-lg font-semibold transition-all duration-300 border border-white/20"
                          : "gradient-emerald text-white hover-glow hover:scale-105 gap-2 shadow-lg transition-all duration-300"
                      }
                    >
                      <Crown className="h-4 w-4" />
                      <span className="hidden lg:inline">Upgrade to Ultra</span>
                      <span className="lg:hidden">Ultra</span>
                    </Button>
                  </Link>
                </Protect>

                {/* Show Ultra badge for Ultra users */}
                <Protect
                  condition={(has) => has({ plan: "ultra" })}
                  fallback={null}
                >
                  <Badge
                    className={
                      isDashboard
                        ? "gap-1.5 hidden md:flex bg-white/95 text-emerald-600 border-0 px-3 py-1.5 shadow-md hover:shadow-lg transition-all duration-300"
                        : "gap-1.5 hidden md:flex gradient-emerald text-white border-0 px-3 py-1.5 shadow-md hover:shadow-lg transition-all duration-300"
                    }
                  >
                    <Crown className="h-3.5 w-3.5" />
                    <span className="font-semibold">Ultra</span>
                  </Badge>
                </Protect>

                {!showDashboardNav && (
                  <Link href="/dashboard/projects">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={
                        isDashboard
                          ? "hover-scale text-white hover:bg-white/20 transition-all duration-300"
                          : "hover-scale transition-all duration-300"
                      }
                    >
                      <span className="hidden lg:inline">My Projects</span>
                      <span className="lg:hidden">Projects</span>
                    </Button>
                  </Link>
                )}
                {showDashboardNav && (
                  <Link href="/" className="hidden lg:block">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={
                        isDashboard
                          ? "gap-2 hover-scale text-white hover:bg-white/20 transition-all duration-300"
                          : "gap-2 hover-scale transition-all duration-300"
                      }
                    >
                      <Home className="h-4 w-4" />
                      Home
                    </Button>
                  </Link>
                )}
                <div className="scale-110 hover:scale-125 transition-transform duration-300">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </>
            ) : (
              <SignInButton mode="modal">
                <Button
                  className={
                    isDashboard
                      ? "bg-white/95 text-emerald-600 hover:bg-white hover:scale-105 shadow-lg font-semibold transition-all duration-300"
                      : "gradient-emerald text-white hover-glow hover:scale-105 shadow-lg transition-all duration-300"
                  }
                >
                  Sign In
                </Button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
