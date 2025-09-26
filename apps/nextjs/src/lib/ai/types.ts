// AI服务接口定义和类型

export interface AnalysisResult {
  prompt: string;
  description: string;
  tags: string[];
  confidence?: number;
  processingTimeMs?: number;
}

export interface ImageAnalysisOptions {
  maxTokens?: number;
  temperature?: number;
  style?: 'photographic' | 'artistic' | 'technical' | 'creative';
  language?: 'en' | 'zh' | 'auto';
}

export interface AIImageAnalyzer {
  analyzeImage(
    imageBuffer: Buffer,
    mimeType: string,
    options?: ImageAnalysisOptions
  ): Promise<AnalysisResult>;

  validateImage(buffer: Buffer, mimeType: string): Promise<boolean>;
  getProviderName(): string;
  isAvailable(): Promise<boolean>;
}

export interface AIServiceConfig {
  provider: 'openai' | 'google' | 'azure' | 'mock';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
  retryCount?: number;
}

export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export const AI_ERROR_CODES = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  IMAGE_TOO_LARGE: 'IMAGE_TOO_LARGE',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  TIMEOUT: 'TIMEOUT'
} as const;