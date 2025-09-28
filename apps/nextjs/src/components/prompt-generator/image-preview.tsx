"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@saasfly/ui/button";
import { Card } from "@saasfly/ui/card";
import * as Icons from "@saasfly/ui/icons";
import { analytics } from "~/lib/monitoring/logger";

interface ImagePreviewProps {
  onPromptGenerated?: (prompt: string, description: string, tags: string[]) => void;
  selectedStyle?: string;
  onAnalyzeReady?: (analyzeFunction: () => void) => void;
  onProcessingStateChange?: (isProcessing: boolean) => void;
  onError?: (error: string) => void;
}

export function ImagePreview({ onPromptGenerated, selectedStyle, onAnalyzeReady, onProcessingStateChange, onError }: ImagePreviewProps) {
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
        const errorMsg = `Unsupported file type: ${file.type}. Please select a JPG, PNG, GIF, or WebP image.`;
        if (onError) {
          onError(errorMsg);
        } else {
          alert(errorMsg);
        }
        return;
      }

      // 验证文件大小 (最大10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        const errorMsg = `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 10MB.`;
        if (onError) {
          onError(errorMsg);
        } else {
          alert(errorMsg);
        }
        return;
      }

      setIsUploading(true);
      setCurrentFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
        setIsUploading(false);
        // Note: Auto-analysis removed - user must click Generate Prompt
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
      formData.append('style', selectedStyle || 'photographic');

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

        // 分析完成
      } else {
        // 处理API错误响应
        const errorMessage = result.error?.message || 'Analysis failed';
        const errorCode = result.error?.code || 'UNKNOWN_ERROR';

        // 检查是否应该重试
        if (shouldRetry(response.status, errorCode) && retryCount < 2) {
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
    const retryableCodes = ['TIMEOUT', 'NETWORK_ERROR', 'SERVICE_UNAVAILABLE', 'WORKFLOW_FAILED'];

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
      case 'WORKFLOW_FAILED':
        return 'Workflow execution failed. Please try again later.';
      case 'FILE_UPLOAD_FAILED':
        return 'File upload failed. Please check your connection and try again.';
      default:
        return originalMessage || 'Failed to analyze image. Please try again.';
    }
  };

  const showErrorMessage = (error: Error) => {
    const message = error.message;
    if (onError) {
      onError(message);
    } else {
      // Fallback to alert if no error handler provided
      alert(message);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // Expose the analyze function to parent component
  const handleAnalyze = useCallback(() => {
    if (currentFile) {
      analyzeImage(currentFile);
    }
  }, [currentFile]);

  // Notify parent when analyze function is ready
  useEffect(() => {
    if (currentFile && onAnalyzeReady) {
      onAnalyzeReady(handleAnalyze);
    }
  }, [currentFile, onAnalyzeReady, handleAnalyze]);

  // Notify parent of processing state changes
  useEffect(() => {
    if (onProcessingStateChange) {
      onProcessingStateChange(isAnalyzing);
    }
  }, [isAnalyzing, onProcessingStateChange]);

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

      {/* 上传按钮 */}
      <Button
        type="button"
        variant="outline"
        className="w-full border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50 hover:border-emerald-500 transition-all duration-300"
        onClick={handleImageClick}
      >
        <Icons.Upload className="mr-2 h-4 w-4" />
        Upload Image
      </Button>
    </div>
  );
}