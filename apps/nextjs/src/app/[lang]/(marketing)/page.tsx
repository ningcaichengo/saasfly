"use client";

import { useState } from "react";
import { ControlPanel } from "~/components/prompt-generator/control-panel";
import { PromptEditor } from "~/components/prompt-generator/prompt-editor";
import { StatsBar } from "~/components/prompt-generator/stats-bar";
import { LanguageSwitcher } from "~/components/language-switcher";
import { Button } from "@saasfly/ui/button";
import * as Icons from "@saasfly/ui/icons";

import type { Locale } from "~/config/i18n-config";

export default function IndexPage({
  params: { lang },
}: {
  params: {
    lang: Locale;
  };
}) {
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [generatedDescription, setGeneratedDescription] = useState<string>("");
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);

  const handlePromptGenerated = (prompt: string, description: string, tags: string[]) => {
    setCurrentPrompt(prompt);
    setGeneratedDescription(description);
    setGeneratedTags(tags);
  };

  const handleRegeneratePrompt = () => {
    // This would typically regenerate based on the current image and style settings
    // For now, we'll just clear the current prompt to trigger regeneration
    console.log("Regenerating prompt with current settings...");
    // In a real implementation, you might want to call the analyze API again
  };
  return (
    <div className="min-h-screen bg-emerald-50">
      {/* Navigation Header */}
      <nav className="w-full bg-emerald-500 border-b border-emerald-600 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icons.Zap className="h-8 w-8 text-white" />
            <h1 className="text-2xl font-bold text-white">
              AI Image Prompt Generator
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <Button
              variant="outline"
              size="sm"
              className="border-white text-white hover:bg-emerald-400"
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
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-emerald-900 mb-4">
            AI Image Prompt Generated in Seconds
          </h2>
          <p className="text-base md:text-lg lg:text-xl font-medium text-emerald-700 max-w-3xl mx-auto mb-6">
            The world's first unlimited free AI image prompt generator
          </p>

          {/* Feature Tags */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <span className="text-xs md:text-sm text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-full font-medium transition-colors cursor-default">
              100% Free
            </span>
            <span className="text-xs md:text-sm text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-full font-medium transition-colors cursor-default">
              No Login Required
            </span>
            <span className="text-xs md:text-sm text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-full font-medium transition-colors cursor-default">
              Unlimited Generations
            </span>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Control Panel */}
          <div className="space-y-6">
            <ControlPanel
              onPromptGenerated={handlePromptGenerated}
              onRegeneratePrompt={handleRegeneratePrompt}
            />
          </div>

          {/* Right Column - Prompt Editor */}
          <div className="space-y-6">
            <PromptEditor
              prompt={currentPrompt}
              onPromptChange={setCurrentPrompt}
            />
            {generatedDescription && (
              <div className="bg-white p-4 rounded-lg border-2 border-emerald-200">
                <h3 className="text-sm font-semibold text-emerald-900 mb-2">Analysis Result:</h3>
                <p className="text-sm text-emerald-700 mb-2">{generatedDescription}</p>
                {generatedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {generatedTags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Statistics Bar */}
      <StatsBar />

      {/* Footer */}
      <footer className="bg-emerald-800 border-t border-emerald-700 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-emerald-100 text-sm">
              © 2024 AI Image Prompt Generator. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-emerald-200 hover:text-white text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-emerald-200 hover:text-white text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-emerald-200 hover:text-white text-sm">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
