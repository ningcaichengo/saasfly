"use client";

import { useEffect, useState } from "react";

interface StatItemProps {
  label: string;
  value: string;
  targetNumber: number;
}

function StatItem({ label, value, targetNumber }: StatItemProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = targetNumber / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetNumber) {
        setDisplayValue(targetNumber);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [targetNumber]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toLocaleString();
  };

  return (
    <div className="flex flex-col items-center justify-center h-16">
      <div className="text-2xl font-bold text-emerald-600 leading-tight">
        {value.includes("4.9") ? "4.9/5.0" : formatNumber(displayValue) + "+"}
      </div>
      <div className="text-sm text-emerald-700 leading-tight">{label}</div>
    </div>
  );
}

export function StatsBar() {
  return (
    <div className="w-full bg-emerald-100 py-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <StatItem
            label="Active Users"
            value="15,700+"
            targetNumber={15700}
          />
          <StatItem
            label="Image Prompts Generated"
            value="2,100,000+"
            targetNumber={2100000}
          />
          <StatItem
            label="User Rating"
            value="4.9/5.0"
            targetNumber={49}
          />
        </div>
      </div>
    </div>
  );
}