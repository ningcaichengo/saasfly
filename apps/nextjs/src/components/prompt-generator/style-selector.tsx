"use client";

import { useState } from "react";
import { Card } from "@saasfly/ui/card";
import { RadioGroup, RadioGroupItem } from "@saasfly/ui/radio-group";
import { Label } from "@saasfly/ui/label";

const styles = [
  { id: "general", name: "General", description: "Standard AI generation" },
  { id: "flux", name: "Flux style", description: "Flux model style" },
  { id: "sd", name: "SD style", description: "Stable Diffusion style" },
  { id: "midjourney", name: "Midjourney", description: "Midjourney style" },
];

export function StyleSelector() {
  const [selectedStyle, setSelectedStyle] = useState("general");

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-[#1F2937]">
        Choose a generation style:
      </Label>
      <Card className="p-4 border-2 border-[#E5E7EB] bg-white">
        <RadioGroup
          value={selectedStyle}
          onValueChange={setSelectedStyle}
          className="space-y-3"
        >
          {styles.map((style) => (
            <div key={style.id} className="flex items-center space-x-2">
              <RadioGroupItem
                value={style.id}
                id={style.id}
                className="border-[#E5E7EB] text-[#5D8BBA]"
              />
              <Label
                htmlFor={style.id}
                className="text-sm text-[#1F2937] cursor-pointer flex-1"
              >
                <span className="font-medium">{style.name}</span>
                <span className="text-[#6B7280] ml-2">({style.description})</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </Card>
    </div>
  );
}