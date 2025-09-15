"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@saasfly/ui/button";
import { Card } from "@saasfly/ui/card";
import * as Icons from "@saasfly/ui/icons";

export function ImagePreview() {
  const [imageSrc, setImageSrc] = useState("/images/astronaut-cat-example.jpg");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="relative h-64 w-full overflow-hidden rounded-lg border-2 border-[#E5E7EB] bg-white">
        <Image
          src={imageSrc}
          alt="Preview"
          fill
          className="object-cover"
          onError={() => {
            // Fallback to placeholder if image fails to load
            setImageSrc("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjlFQUZCIi8+CjxwYXRoIGQ9Ik0xNTAgMTAwTDE3NSAxMjVIMTI1TDE1MCAxMDBaIiBmaWxsPSIjNkI3MjgwIi8+CjxjaXJjbGUgY3g9IjE4MCIgY3k9IjcwIiByPSIxNSIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4K");
          }}
        />
      </Card>

      <div className="space-y-2">
        <label htmlFor="image-upload">
          <Button
            type="button"
            variant="outline"
            className="w-full border-[#E5E7EB] bg-white text-[#1F2937] hover:bg-[#F9EAFB] hover:border-[#5D8BBA]"
            onClick={() => document.getElementById('image-upload')?.click()}
          >
            <Icons.Upload className="mr-2 h-4 w-4" />
            Upload New Image
          </Button>
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
}