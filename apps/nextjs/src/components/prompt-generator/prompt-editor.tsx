"use client";

import { useState } from "react";
import { Button } from "@saasfly/ui/button";
import { Card } from "@saasfly/ui/card";
import { Label } from "@saasfly/ui/label";
import * as Icons from "@saasfly/ui/icons";

const defaultPrompt = "A stunning PHOTOGRAPH of an astronaut cat, sitting on the moon, STARGAZING, HYPERDETAILED, cinematic lighting, < --ar 16:9 --s 750 >";

export function PromptEditor() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Simple syntax highlighting function
  const renderHighlightedText = (text: string) => {
    // Split text into parts and highlight
    const parts = text.split(/(\b[A-Z]{2,}\b|<[^>]*>)/g);

    return parts.map((part, index) => {
      if (/^[A-Z]{2,}$/.test(part)) {
        // Highlight uppercase words in Serene Blue
        return (
          <span key={index} className="text-[#5D8BBA] font-semibold">
            {part}
          </span>
        );
      } else if (/^<.*>$/.test(part)) {
        // Highlight parameters in Graphite
        return (
          <span key={index} className="text-[#6B7280] font-mono">
            {part}
          </span>
        );
      } else {
        // Normal text in Charcoal
        return (
          <span key={index} className="text-[#1F2937]">
            {part}
          </span>
        );
      }
    });
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium text-[#1F2937]">
        PROMPT STUDIO (Editable)
      </Label>

      <Card className="p-4 border-2 border-[#E5E7EB] bg-white">
        <div className="space-y-4">
          {/* Preview of highlighted text */}
          <div className="min-h-[120px] p-3 bg-[#F9EAFB] rounded-md border border-[#E5E7EB] text-sm leading-relaxed">
            {renderHighlightedText(prompt)}
          </div>

          {/* Editable textarea */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px] w-full p-3 border border-[#E5E7EB] bg-white text-[#1F2937] rounded-md focus:border-[#5D8BBA] focus:ring-2 focus:ring-[#5D8BBA] focus:outline-none resize-none"
            placeholder="Enter your prompt here..."
            rows={5}
          />

          <div className="flex justify-end">
            <Button
              onClick={handleCopy}
              variant="secondary"
              size="sm"
              className="bg-[#5D8BBA] text-white hover:bg-[#4A7AA3]"
            >
              {copied ? (
                <>
                  <Icons.Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Icons.Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}