import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export async function CtaSection() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 gradient-emerald"></div>

      {/* Decorative elements */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-float"></div>
      <div
        className="absolute bottom-10 left-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-float"
        style={{ animationDelay: "1.5s" }}
      ></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-3xl p-12 md:p-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-white drop-shadow-lg">
              Ready to supercharge your podcast workflow?
            </h2>
            <p className="text-xl md:text-2xl text-white mb-10 leading-relaxed drop-shadow-md">
              Upload your first podcast and see the magic happen in minutes.
            </p>
            {isSignedIn ? (
              <Link href="/dashboard/upload">
                <Button
                  size="lg"
                  className="bg-white text-emerald-600 hover:bg-white/90 hover-glow text-lg px-10 py-7 rounded-xl shadow-2xl font-bold"
                >
                  <Upload className="mr-2 h-6 w-6" />
                  Upload Your First Podcast
                </Button>
              </Link>
            ) : (
              <SignInButton mode="modal">
                <Button
                  size="lg"
                  className="bg-white text-emerald-600 hover:bg-white/90 hover-glow text-lg px-10 py-7 rounded-xl shadow-2xl font-bold"
                >
                  Get Started Now
                  <Sparkles className="ml-2 h-6 w-6" />
                </Button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
