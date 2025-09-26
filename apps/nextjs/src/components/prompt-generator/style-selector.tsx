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

interface StyleSelectorProps {
  className?: string;
}

export function StyleSelector({ className }: StyleSelectorProps = {}) {
  const [selectedStyle, setSelectedStyle] = useState("general");

  return (
    <Select value={selectedStyle} onValueChange={setSelectedStyle}>
      <SelectTrigger className="w-full border-emerald-200 text-emerald-900 focus:border-emerald-500 focus:ring-emerald-500">
        <SelectValue placeholder="Select a style" />
      </SelectTrigger>
      <SelectContent className="bg-white border-emerald-200">
        {styles.map((style) => (
          <SelectItem
            key={style.id}
            value={style.id}
            className="text-emerald-900 hover:bg-emerald-50 cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{style.name}</span>
              <span className="text-emerald-700 text-xs">{style.description}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}