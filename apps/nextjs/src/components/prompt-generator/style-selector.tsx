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
  { id: "photographic", name: "General", description: "Standard AI generation" },
  { id: "artistic", name: "Flux style", description: "Flux model style" },
  { id: "technical", name: "SD style", description: "Stable Diffusion style" },
  { id: "creative", name: "Midjourney", description: "Midjourney style" },
];

interface StyleSelectorProps {
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function StyleSelector({ className, value, onValueChange }: StyleSelectorProps = {}) {
  const [selectedStyle, setSelectedStyle] = useState("photographic");

  const currentValue = value !== undefined ? value : selectedStyle;
  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setSelectedStyle(newValue);
    }
  };

  return (
    <Select value={currentValue} onValueChange={handleValueChange}>
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