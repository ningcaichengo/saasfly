"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@saasfly/ui/button";
import { Card } from "@saasfly/ui/card";
import * as Icons from "@saasfly/ui/icons";
import { analytics } from "~/lib/monitoring/logger";

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

  const analyzeImage = async (file: File, retryCount: number = 0) => {
    if (!onPromptGenerated) return;

    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success && result.data) {
        onPromptGenerated(result.data.prompt, result.data.description, result.data.tags);

        // Track successful prompt generation in frontend
        analytics.track('prompt_generated_frontend', {
          provider: result.data.provider,
          processing_time: result.data.processingTime?.total,
          prompt_length: result.data.prompt?.length,
          tags_count: result.data.tags?.length,
          confidence: result.data.confidence,
          file_size: file.size,
          file_type: file.type
        });

        // 显示成功信息（可选）
        if (result.data.provider !== 'mock') {
          console.log(`Analysis completed using ${result.data.provider} in ${result.data.processingTime?.total}ms`);
        }
      } else {
        // 处理API错误响应
        const errorMessage = result.error?.message || 'Analysis failed';
        const errorCode = result.error?.code || 'UNKNOWN_ERROR';

        // 检查是否应该重试
        if (shouldRetry(response.status, errorCode) && retryCount < 2) {
          console.log(`Retrying analysis (attempt ${retryCount + 1}/3)...`);

          // 计算重试延迟
          const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));

          return analyzeImage(file, retryCount + 1);
        }

        // Track analysis failure in frontend
        analytics.track('analysis_failed_frontend', {
          error_code: errorCode,
          error_message: errorMessage,
          status_code: response.status,
          retry_count: retryCount,
          file_size: file.size,
          file_type: file.type
        });

        throw new Error(getErrorMessage(response.status, errorCode, errorMessage));
      }
    } catch (error) {
      console.error('Error analyzing image:', error);

      // Track frontend errors
      analytics.track('frontend_error', {
        error_type: 'analysis_exception',
        error_message: error instanceof Error ? error.message : String(error),
        retry_count: retryCount,
        file_size: file.size,
        file_type: file.type
      });

      // 显示用户友好的错误信息
      showErrorMessage(error as Error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const shouldRetry = (status: number, code: string): boolean => {
    // 重试条件：网络错误、超时、服务不可用、限流
    const retryableStatuses = [408, 429, 502, 503, 504];
    const retryableCodes = ['TIMEOUT', 'NETWORK_ERROR', 'SERVICE_UNAVAILABLE'];

    return retryableStatuses.includes(status) || retryableCodes.includes(code);
  };

  const getErrorMessage = (status: number, code: string, originalMessage: string): string => {
    switch (code) {
      case 'IMAGE_TOO_LARGE':
        return 'Image file is too large. Please use an image smaller than 10MB.';
      case 'UNSUPPORTED_FORMAT':
        return 'Unsupported image format. Please use JPG, PNG, GIF, or WebP.';
      case 'QUOTA_EXCEEDED':
        return 'AI service quota exceeded. Please try again later.';
      case 'INVALID_API_KEY':
        return 'AI service is temporarily unavailable. Please try again later.';
      case 'TIMEOUT':
        return 'Analysis timed out. Please try with a smaller image.';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection and try again.';
      case 'SERVICE_UNAVAILABLE':
        return 'AI service is temporarily unavailable. Please try again later.';
      default:
        return originalMessage || 'Failed to analyze image. Please try again.';
    }
  };

  const showErrorMessage = (error: Error) => {
    // 在生产环境中，这里可以使用更优雅的通知组件
    alert(error.message);
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