"use client";

import { useState } from "react";
import { Card } from "@saasfly/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@saasfly/ui/select";
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
        <Select value={selectedStyle} onValueChange={setSelectedStyle}>
          <SelectTrigger className="w-full border-[#E5E7EB] text-[#1F2937] focus:border-[#5D8BBA] focus:ring-[#5D8BBA]">
            <SelectValue placeholder="Select a style" />
          </SelectTrigger>
          <SelectContent className="bg-white border-[#E5E7EB]">
            {styles.map((style) => (
              <SelectItem
                key={style.id}
                value={style.id}
                className="text-[#1F2937] hover:bg-[#F9EAFB] cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{style.name}</span>
                  <span className="text-[#6B7280] text-xs">{style.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>
    </div>
  );
}