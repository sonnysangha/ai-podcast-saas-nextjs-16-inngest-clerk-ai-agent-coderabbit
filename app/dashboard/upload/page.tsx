import { PodcastUploader } from "@/components/podcast-uploader";

export default function UploadPage() {
  return (
    <div className="min-h-screen mesh-background-subtle">
      <div className="container max-w-5xl mx-auto py-16 px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold mb-4">
            Upload Your <span className="gradient-emerald-text">Podcast</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Upload your audio file to generate AI-powered insights, summaries, and
            social media content.
          </p>
        </div>

        {/* Upload Area */}
        <div className="space-y-8">
          <PodcastUploader />

          {/* Info Card */}
          <div className="glass-card rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6 gradient-emerald-text">What happens next?</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="p-2 rounded-xl gradient-emerald shrink-0 mt-1">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Secure Upload</p>
                  <p className="text-gray-600">Your file will be securely uploaded to our storage</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="p-2 rounded-xl gradient-emerald shrink-0 mt-1">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">AI Transcription</p>
                  <p className="text-gray-600">AI will transcribe your podcast and extract key moments</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="p-2 rounded-xl gradient-emerald shrink-0 mt-1">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Content Generation</p>
                  <p className="text-gray-600">Generate summaries, social posts, titles, and hashtags</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="p-2 rounded-xl gradient-emerald shrink-0 mt-1">
                  <span className="text-white font-bold text-lg">4</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">View Results</p>
                  <p className="text-gray-600">Access your results in the project dashboard</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
