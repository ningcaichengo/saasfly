"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@saasfly/ui/button";
import { Card } from "@saasfly/ui/card";
import { Label } from "@saasfly/ui/label";
import * as Icons from "@saasfly/ui/icons";
import { ImagePreview } from "./image-preview";
import { StyleSelector } from "./style-selector";

interface ControlPanelProps {
  onPromptGenerated?: (prompt: string, description: string, tags: string[]) => void;
  onRegeneratePrompt?: () => void;
  onError?: (error: string) => void;
}

export function ControlPanel({ onPromptGenerated, onRegeneratePrompt, onError }: ControlPanelProps) {
  const [selectedStyle, setSelectedStyle] = useState("photographic");
  const [analyzeFunction, setAnalyzeFunction] = useState<(() => void) | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleAnalyzeReady = useCallback((analyzeFn: () => void) => {
    setAnalyzeFunction(() => analyzeFn);
  }, []);

  const handleProcessingStateChange = useCallback((processing: boolean) => {
    setIsProcessing(processing);
  }, []);

  const handleGeneratePrompt = useCallback(() => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;

    // Prevent rapid clicking (minimum 500ms between clicks)
    if (timeSinceLastClick < 500) {
      return;
    }

    // Clear any existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set a debounce timer to execute after 300ms
    debounceRef.current = setTimeout(() => {
      if (analyzeFunction) {
        analyzeFunction();
      } else if (onRegeneratePrompt) {
        onRegeneratePrompt();
      }
    }, 300);

    setLastClickTime(now);
  }, [analyzeFunction, onRegeneratePrompt, lastClickTime]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <Card className="p-6 border-2 border-emerald-200 bg-white">
      <div className="space-y-6">
        <div>
          <Label className="text-lg font-semibold text-emerald-900 mb-4 block">
            CONTROL PANEL
          </Label>
        </div>

        <div className="space-y-4">
          <ImagePreview
            onPromptGenerated={onPromptGenerated}
            selectedStyle={selectedStyle}
            onAnalyzeReady={handleAnalyzeReady}
            onProcessingStateChange={handleProcessingStateChange}
            onError={onError}
          />

          {/* StyleSelector 和按钮水平排列 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-emerald-900">
              Choose a generation style:
            </Label>
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <Card className="p-4 border-2 border-emerald-200 bg-white">
                  <StyleSelector
                    value={selectedStyle}
                    onValueChange={setSelectedStyle}
                  />
                </Card>
              </div>
              <Button
                onClick={handleGeneratePrompt}
                className="bg-emerald-500 text-white hover:bg-emerald-600 font-medium py-3 px-4 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    GENERATING...
                  </>
                ) : (
                  <>
                    <Icons.Zap className="mr-2 h-5 w-5" />
                    GENERATE PROMPT
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}