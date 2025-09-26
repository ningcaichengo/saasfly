"use client";

import { Button } from "@saasfly/ui/button";
import { Card } from "@saasfly/ui/card";
import { Label } from "@saasfly/ui/label";
import * as Icons from "@saasfly/ui/icons";
import { ImagePreview } from "./image-preview";
import { StyleSelector } from "./style-selector";

interface ControlPanelProps {
  onPromptGenerated?: (prompt: string, description: string, tags: string[]) => void;
  onRegeneratePrompt?: () => void;
}

export function ControlPanel({ onPromptGenerated, onRegeneratePrompt }: ControlPanelProps) {
  const handleRegenerate = () => {
    if (onRegeneratePrompt) {
      onRegeneratePrompt();
    } else {
      console.log("Regenerating prompt...");
    }
  };

  return (
    <Card className="p-6 border-2 border-emerald-200 bg-white">
      <div className="space-y-6">
        <div>
          <Label className="text-lg font-semibold text-emerald-900 mb-4 block">
            CONTROL PANEL
          </Label>
        </div>

        <div className="space-y-4">
          <ImagePreview onPromptGenerated={onPromptGenerated} />

          {/* StyleSelector 和按钮水平排列 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-emerald-900">
              Choose a generation style:
            </Label>
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <Card className="p-4 border-2 border-emerald-200 bg-white">
                  <StyleSelector />
                </Card>
              </div>
              <Button
                onClick={handleRegenerate}
                className="bg-emerald-500 text-white hover:bg-emerald-600 font-medium py-3 px-4 whitespace-nowrap"
                size="lg"
              >
                <Icons.RefreshCw className="mr-2 h-5 w-5" />
                RE-GENERATE PROMPT
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}