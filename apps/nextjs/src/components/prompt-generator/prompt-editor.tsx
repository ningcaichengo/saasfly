"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@saasfly/ui/button";
import { Card } from "@saasfly/ui/card";
import { Label } from "@saasfly/ui/label";
import * as Icons from "@saasfly/ui/icons";

const defaultPrompt = "A sun, Space Opera scene. Vast starfield with colorful nebulae. Massive ornate spacecraft. Alien planet with multiple moons. Dramatic space lighting. Advanced tech elements. Diverse alien species. Epic scale. Vibrant cosmic colors. Sleek futuristic designs";

interface PromptEditorProps {
  prompt?: string;
  onPromptChange?: (prompt: string) => void;
}

export function PromptEditor({ prompt: externalPrompt, onPromptChange }: PromptEditorProps) {
  const [prompt, setPrompt] = useState(externalPrompt || defaultPrompt);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update prompt when external prompt changes
  useEffect(() => {
    if (externalPrompt) {
      setPrompt(externalPrompt);
    }
  }, [externalPrompt]);

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
    if (onPromptChange) {
      onPromptChange(newPrompt);
    }
  };

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
        // Highlight uppercase words in emerald
        return (
          <span key={index} className="text-emerald-600 font-semibold">
            {part}
          </span>
        );
      } else if (/^<.*>$/.test(part)) {
        // Highlight parameters in emerald gray
        return (
          <span key={index} className="text-emerald-500 font-mono">
            {part}
          </span>
        );
      } else {
        // Normal text in emerald black
        return (
          <span key={index} className="text-emerald-900">
            {part}
          </span>
        );
      }
    });
  };

  return (
    <Card className="p-6 border-2 border-emerald-200 bg-white">
      <div className="space-y-6">
        <div>
          <Label className="text-lg font-semibold text-emerald-900 mb-4 block">
            PROMPT STUDIO (Editable)
          </Label>
        </div>

        <div className="space-y-4">
          {/* Combined Preview and Edit Area */}
          <div
            className={`min-h-[120px] p-4 bg-emerald-50 rounded-md transition-all duration-200 cursor-text relative ${
              isEditing
                ? 'border-2 border-emerald-500 ring-2 ring-emerald-500 ring-opacity-20'
                : isHovering
                ? 'border-2 border-emerald-300'
                : 'border-2 border-dashed border-emerald-300'
            }`}
            onClick={() => {
              setIsEditing(true);
              setTimeout(() => textareaRef.current?.focus(), 0);
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                onBlur={() => setIsEditing(false)}
                className="w-full h-full min-h-[100px] bg-transparent text-emerald-900 text-sm leading-relaxed resize-none outline-none"
                placeholder="Enter your prompt here..."
                autoFocus
              />
            ) : (
              <div className="text-sm leading-relaxed">
                {renderHighlightedText(prompt)}
                {!isHovering && (
                  <div className="flex items-center text-emerald-600 mt-2 text-xs opacity-60">
                    <span className="mr-1">✏️</span>
                    Click to edit prompt
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleCopy}
              variant="secondary"
              size="sm"
              className="bg-emerald-500 text-white hover:bg-emerald-600"
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
      </div>
    </Card>
  );
}