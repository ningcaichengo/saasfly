"use client";

import { Button } from "@saasfly/ui/button";
import { Card } from "@saasfly/ui/card";
import { Label } from "@saasfly/ui/label";
import * as Icons from "@saasfly/ui/icons";
import { ImagePreview } from "./image-preview";
import { StyleSelector } from "./style-selector";

export function ControlPanel() {
  const handleRegenerate = () => {
    // Simulate regeneration process
    console.log("Regenerating prompt...");
  };

  return (
    <Card className="p-6 border-2 border-[#E5E7EB] bg-white">
      <div className="space-y-6">
        <div>
          <Label className="text-lg font-semibold text-[#1F2937] mb-4 block">
            CONTROL PANEL
          </Label>
        </div>

        <div className="space-y-4">
          <ImagePreview />
          <StyleSelector />

          <div className="pt-4">
            <Button
              onClick={handleRegenerate}
              className="w-full bg-[#5D8BBA] text-white hover:bg-[#4A7AA3] font-medium py-3"
              size="lg"
            >
              <Icons.RefreshCw className="mr-2 h-5 w-5" />
              RE-GENERATE PROMPT
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}