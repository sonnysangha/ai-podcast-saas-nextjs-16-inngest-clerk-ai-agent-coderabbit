"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { Home, Sparkles } from "lucide-react";
import Link from "next/link";
import { DashboardNav } from "@/components/dashboard-nav";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  showDashboardNav?: boolean;
};

export function Header({ showDashboardNav = false }: HeaderProps) {
  const { isSignedIn } = useAuth();

  return (
    <header className="border-b bg-background sticky top-0">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Podassi</span>
          </Link>

          {/* Dashboard Navigation inline with logo */}
          {showDashboardNav && <DashboardNav />}
        </div>

        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <>
              {!showDashboardNav && (
                <Link href="/dashboard/projects">
                  <Button variant="ghost">My Projects</Button>
                </Link>
              )}
              {showDashboardNav && (
                <Link href="/" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Home className="h-4 w-4" />
                    Home
                  </Button>
                </Link>
              )}
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <SignInButton mode="modal">
              <Button>Sign In</Button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
