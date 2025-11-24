import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { PodcastUploader } from "@/components/podcast-uploader";
import { Button } from "@/components/ui/button";

export async function HeroSection() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <section className="relative overflow-hidden mesh-background">
      <div className="container mx-auto px-4 py-24 md:pb-32 md:pt-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20 animate-float">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-card hover-glow mb-8 animate-shimmer">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                AI-Powered Podcast Processing
              </span>
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold mb-8 leading-tight">
              <span className="gradient-emerald-text">Transform</span> Your
              <br />
              Podcasts with AI
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Upload your podcast audio and get AI-generated summaries,
              transcripts, social posts, key moments, and more - all in minutes.
            </p>
          </div>

          {isSignedIn ? (
            <div className="space-y-6">
              <div className="glass-card-strong rounded-2xl p-8 hover-lift">
                <PodcastUploader />
              </div>
              <div className="text-center">
                <Link href="/dashboard/projects">
                  <Button variant="outline" size="lg" className="hover-glow">
                    View All Projects
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignInButton mode="modal">
                <Button
                  size="lg"
                  className="gradient-emerald text-white hover-glow text-lg px-8 py-6 rounded-xl shadow-lg"
                >
                  Get Started
                  <Sparkles className="ml-2 h-6 w-6" />
                </Button>
              </SignInButton>
              <Link href="/dashboard/projects">
                <Button
                  size="lg"
                  variant="outline"
                  className="hover-glow text-lg px-8 py-6 rounded-xl"
                >
                  View Projects
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div
        className="absolute bottom-0 left-0 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
        style={{ animationDelay: "1s" }}
      ></div>
    </section>
  );
}
