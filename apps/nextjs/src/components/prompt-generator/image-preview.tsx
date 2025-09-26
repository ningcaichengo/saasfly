"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@saasfly/ui/button";
import { Card } from "@saasfly/ui/card";
import * as Icons from "@saasfly/ui/icons";

interface ImagePreviewProps {
  onPromptGenerated?: (prompt: string, description: string, tags: string[]) => void;
}

export function ImagePreview({ onPromptGenerated }: ImagePreviewProps) {
  const [imageSrc, setImageSrc] = useState("/images/space-opera-default.png");
  const [isHovering, setIsHovering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPG, PNG, GIF, WebP)');
        return;
      }

      setIsUploading(true);
      setCurrentFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
        setIsUploading(false);
        // Auto-analyze the uploaded image
        analyzeImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (file: File) => {
    if (!onPromptGenerated) return;

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const result = await response.json();
      onPromptGenerated(result.prompt, result.description, result.tags);
    } catch (error) {
      console.error('Error analyzing image:', error);
      alert('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleManualAnalyze = () => {
    if (currentFile) {
      analyzeImage(currentFile);
    }
  };

  return (
    <div className="space-y-4">
      <Card
        className="relative h-64 w-full overflow-hidden rounded-lg border-2 border-emerald-200 bg-white cursor-pointer transition-all duration-300 hover:border-emerald-400 hover:shadow-lg"
        onClick={handleImageClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Image
          src={imageSrc}
          alt="Preview"
          fill
          className="object-contain transition-all duration-300"
          onError={() => {
            // Fallback to placeholder if image fails to load
            setImageSrc("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjBGREY0Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwTDE3NSAxMjVIMTI1TDE1MCAxMDBaIiBmaWxsPSIjMTBCOTgxIi8+CjxjaXJjbGUgY3g9IjE4MCIgY3k9IjcwIiByPSIxNSIgZmlsbD0iIzEwQjk4MSIvPgo8L3N2Zz4K");
          }}
        />

        {/* 悬停遮罩层 */}
        {(isHovering || isUploading || isAnalyzing) && (
          <div className="absolute inset-0 bg-emerald-600/70 flex items-center justify-center transition-all duration-300">
            {isUploading ? (
              <div className="flex flex-col items-center text-emerald-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-900 mb-2"></div>
                <span className="text-sm font-medium">Uploading...</span>
              </div>
            ) : isAnalyzing ? (
              <div className="flex flex-col items-center text-emerald-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-900 mb-2"></div>
                <span className="text-sm font-medium">Analyzing Image...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-emerald-900">
                <Icons.Upload className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">Click to Upload Image</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* 按钮组 */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50 hover:border-emerald-500 transition-all duration-300"
          onClick={handleImageClick}
        >
          <Icons.Upload className="mr-2 h-4 w-4" />
          Upload Image
        </Button>
        {currentFile && (
          <Button
            type="button"
            variant="default"
            className="bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-300"
            onClick={handleManualAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Icons.Zap className="mr-2 h-4 w-4" />
                Analyze Image
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}