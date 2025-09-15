import { ControlPanel } from "~/components/prompt-generator/control-panel";
import { PromptEditor } from "~/components/prompt-generator/prompt-editor";
import { StatsBar } from "~/components/prompt-generator/stats-bar";
import { LanguageSwitcher } from "~/components/language-switcher";
import { Button } from "@saasfly/ui/button";
import * as Icons from "@saasfly/ui/icons";

import type { Locale } from "~/config/i18n-config";

export default async function IndexPage({
  params: { lang },
}: {
  params: {
    lang: Locale;
  };
}) {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Navigation Header */}
      <nav className="w-full bg-white border-b border-[#E5E7EB] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icons.Zap className="h-8 w-8 text-[#5D8BBA]" />
            <h1 className="text-2xl font-bold text-[#1F2937]">
              AI Image Prompt Generator
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <Button
              variant="outline"
              size="sm"
              className="border-[#E5E7EB] text-[#1F2937] hover:bg-[#F9EAFB]"
            >
              <Icons.User className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#1F2937] mb-4">
            Generate Perfect AI Image Prompts
          </h2>
          <p className="text-xl text-[#6B7280] max-w-3xl mx-auto">
            Transform your ideas into detailed, optimized prompts for AI image generation.
            Upload an image or describe your vision to get professional-quality prompts.
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Control Panel */}
          <div className="space-y-6">
            <ControlPanel />
          </div>

          {/* Right Column - Prompt Editor */}
          <div className="space-y-6">
            <PromptEditor />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            size="lg"
            className="bg-[#5D8BBA] text-white hover:bg-[#4A7AA3] font-medium px-8 py-3"
          >
            <Icons.Download className="mr-2 h-5 w-5" />
            Download Prompt
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-[#5D8BBA] text-[#5D8BBA] hover:bg-[#F9EAFB] font-medium px-8 py-3"
          >
            <Icons.Share className="mr-2 h-5 w-5" />
            Share Prompt
          </Button>
        </div>
      </main>

      {/* Statistics Bar */}
      <StatsBar />

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-[#6B7280] text-sm">
              © 2024 AI Image Prompt Generator. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-[#6B7280] hover:text-[#5D8BBA] text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-[#6B7280] hover:text-[#5D8BBA] text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-[#6B7280] hover:text-[#5D8BBA] text-sm">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
