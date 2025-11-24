import {
  FileText,
  Hash,
  type LucideIcon,
  MessageSquare,
  Sparkles,
  Upload,
  Zap,
  Users,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: "AI-Powered Analysis",
    description:
      "Advanced audio analysis using AssemblyAI to understand your podcast content and power all AI features.",
  },
  {
    icon: FileText,
    title: "Smart Summaries",
    description:
      "Generate comprehensive summaries with key points and insights from your podcast content.",
  },
  {
    icon: MessageSquare,
    title: "Social Posts",
    description:
      "Generate platform-optimized social media posts for Twitter, LinkedIn, Instagram, TikTok, YouTube, and Facebook.",
  },
  {
    icon: Hash,
    title: "Titles & Hashtags",
    description:
      "Get SEO-optimized titles and platform-specific hashtags automatically for maximum reach.",
  },
  {
    icon: Zap,
    title: "Key Moments & Chapters",
    description:
      "Automatically identify viral moments and generate YouTube timestamps for better engagement.",
  },
  {
    icon: Users,
    title: "Speaker Dialogue",
    description:
      "Full transcript with speaker identification - see exactly who said what and when (ULTRA only).",
  },
];

export function FeaturesSection() {
  return (
    <section className="container mx-auto px-4 py-24 md:py-32">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need in{" "}
            <span className="gradient-emerald-text">One Platform</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful AI tools to amplify your podcast's reach and engagement
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="glass-card rounded-2xl hover-lift p-8 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="rounded-2xl gradient-emerald p-4 w-fit mb-6 group-hover:animate-pulse-emerald transition-all">
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-emerald-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
