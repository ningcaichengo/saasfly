import { AIImageAnalyzer, AnalysisResult, AIServiceError, ImageAnalysisOptions, AI_ERROR_CODES } from '../types';

// 扣子工作流API响应类型
interface CozeFileUploadResponse {
  code: number;
  data: {
    id: string;
    bytes: number;
    created_at: number;
    file_name: string;
  };
  detail: {
    logid: string;
  };
  msg: string;
}

interface CozeWorkflowResponse {
  code: number;
  data: string; // JSON字符串，包含实际的输出数据
  debug_url: string;
  usage?: {
    token_count: number;
    output_count: number;
    input_count: number;
  };
  msg: string;
}

export class CozeImageAnalyzer implements AIImageAnalyzer {
  private apiToken: string;
  private baseUrl: string;
  private workflowId: string;
  private timeout: number;

  constructor(config: {
    apiToken: string;
    baseUrl?: string;
    workflowId: string;
    timeout?: number;
  }) {
    this.apiToken = config.apiToken;
    this.baseUrl = config.baseUrl || 'https://api.coze.cn';
    this.workflowId = config.workflowId;
    this.timeout = config.timeout || 30000;
  }

  async analyzeImage(
    imageBuffer: Buffer,
    mimeType: string,
    options?: ImageAnalysisOptions
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      // 步骤1: 上传图片文件
      const fileId = await this.uploadFile(imageBuffer, mimeType);

      // 步骤2: 执行工作流
      const workflowResult = await this.executeWorkflow(fileId, options);

      const processingTime = Date.now() - startTime;

      // 解析工作流输出
      return this.parseWorkflowOutput(workflowResult, processingTime);

    } catch (error) {
      const processingTime = Date.now() - startTime;

      if (error instanceof AIServiceError) {
        throw error;
      }

      // 处理未知错误
      throw new AIServiceError(
        `Coze分析失败: ${error instanceof Error ? error.message : String(error)}`,
        AI_ERROR_CODES.SERVICE_UNAVAILABLE,
        'coze',
        error instanceof Error ? error : undefined
      );
    }
  }

  private async uploadFile(imageBuffer: Buffer, mimeType: string): Promise<string> {
    const formData = new FormData();

    // 创建文件blob
    const blob = new Blob([imageBuffer], { type: mimeType });
    formData.append('file', blob, `image.${this.getFileExtension(mimeType)}`);
    formData.append('purpose', 'user_upload');

    try {
      const response = await fetch(`${this.baseUrl}/v1/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
        body: formData,
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new AIServiceError(
          `文件上传失败: ${response.status} ${response.statusText} - ${errorText}`,
          this.getErrorCodeFromStatus(response.status, 'upload'),
          'coze'
        );
      }

      const result: CozeFileUploadResponse = await response.json();
      return result.data.id;

    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIServiceError(
          '文件上传超时',
          AI_ERROR_CODES.TIMEOUT,
          'coze',
          error
        );
      }

      throw new AIServiceError(
        `文件上传网络错误: ${error instanceof Error ? error.message : String(error)}`,
        AI_ERROR_CODES.FILE_UPLOAD_FAILED,
        'coze',
        error instanceof Error ? error : undefined
      );
    }
  }

  private async executeWorkflow(fileId: string, options?: ImageAnalysisOptions): Promise<CozeWorkflowResponse> {
    // 映射前端风格到工作流参数
    const modelMap: Record<string, string> = {
      'photographic': 'normal',
      'artistic': 'flux',
      'technical': 'stableDiffusion',
      'creative': 'midjourney'
    };

    const requestBody = {
      "workflow_id": this.workflowId,
      "parameters": {
        "img": `{"file_id":"${fileId}"}`,
        "prompttype": modelMap[options?.style || 'photographic'] || 'flux',
        "userquery": "请为这张图片生成详细的AI绘画提示词"
      }
    };


    try {
      const response = await fetch(`${this.baseUrl}/v1/workflow/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new AIServiceError(
          `工作流执行失败: ${response.status} ${response.statusText} - ${errorText}`,
          this.getErrorCodeFromStatus(response.status, 'workflow'),
          'coze'
        );
      }

      const result: CozeWorkflowResponse = await response.json();

      // 检查工作流执行状态
      if (result.code !== 0) {
        throw new AIServiceError(
          `工作流返回错误: ${result.msg}`,
          AI_ERROR_CODES.WORKFLOW_FAILED,
          'coze'
        );
      }

      if (result.data.execute_status === 'FAILED') {
        throw new AIServiceError(
          '工作流执行失败',
          AI_ERROR_CODES.WORKFLOW_FAILED,
          'coze'
        );
      }

      return result;

    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIServiceError(
          '工作流执行超时',
          AI_ERROR_CODES.TIMEOUT,
          'coze',
          error
        );
      }

      throw new AIServiceError(
        `工作流执行网络错误: ${error instanceof Error ? error.message : String(error)}`,
        AI_ERROR_CODES.NETWORK_ERROR,
        'coze',
        error instanceof Error ? error : undefined
      );
    }
  }

  private parseWorkflowOutput(workflowResult: CozeWorkflowResponse, processingTime: number): AnalysisResult {
    try {
      // 解析JSON字符串格式的data
      const parsedData = JSON.parse(workflowResult.data);

      // 从解析后的数据中提取提示词
      const prompt = parsedData.output || parsedData.prompt || parsedData.result || '';

      // 生成描述（使用提示词的前200个字符）
      const description = prompt.slice(0, 200) + (prompt.length > 200 ? '...' : '');

      // 生成标签（从提示词中提取关键词）
      const tags = this.extractTagsFromPrompt(prompt);

      const result = {
        prompt,
        description,
        tags,
        confidence: 0.9, // Coze工作流通常有较高的可信度
        processingTimeMs: processingTime
      };

      return result;

    } catch (error) {
      console.error('[COZE] Failed to parse workflow output:', error);
      console.error('[COZE] Raw data that failed to parse:', workflowResult.data);

      // 如果解析失败，尝试直接使用data作为提示词
      const fallbackPrompt = typeof workflowResult.data === 'string' ? workflowResult.data : 'Failed to parse workflow output';

      return {
        prompt: fallbackPrompt,
        description: fallbackPrompt.slice(0, 200) + '...',
        tags: this.extractTagsFromPrompt(fallbackPrompt),
        confidence: 0.5, // 降低可信度因为解析失败
        processingTimeMs: processingTime
      };
    }
  }

  private extractTagsFromPrompt(prompt: string): string[] {
    // 简单的标签提取逻辑
    const keywords = prompt
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['the', 'and', 'with', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'run', 'too', 'use', 'way', 'she', 'many', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'over', 'such', 'take', 'than', 'them', 'well', 'will'].includes(word));

    // 去重并限制数量
    return [...new Set(keywords)].slice(0, 8);
  }

  private getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp'
    };
    return extensions[mimeType] || 'jpg';
  }

  private getErrorCodeFromStatus(status: number, operation: 'upload' | 'workflow'): string {
    switch (status) {
      case 401:
        return AI_ERROR_CODES.INVALID_API_KEY;
      case 413:
        return AI_ERROR_CODES.IMAGE_TOO_LARGE;
      case 415:
        return AI_ERROR_CODES.UNSUPPORTED_FORMAT;
      case 429:
        return AI_ERROR_CODES.QUOTA_EXCEEDED;
      case 503:
        return AI_ERROR_CODES.SERVICE_UNAVAILABLE;
      default:
        return operation === 'upload' ? AI_ERROR_CODES.FILE_UPLOAD_FAILED : AI_ERROR_CODES.WORKFLOW_FAILED;
    }
  }

  async validateImage(buffer: Buffer, mimeType: string): Promise<boolean> {
    // 验证文件类型
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!supportedTypes.includes(mimeType)) {
      return false;
    }

    // 验证文件大小 (10MB限制)
    const maxSize = 10 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return false;
    }

    // 验证图片文件头
    return this.validateImageHeader(buffer, mimeType);
  }

  private validateImageHeader(buffer: Buffer, mimeType: string): boolean {
    if (buffer.length < 8) return false;

    const signatures: Record<string, number[]> = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/jpg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      'image/gif': [0x47, 0x49, 0x46],
      'image/webp': [0x52, 0x49, 0x46, 0x46] // RIFF header
    };

    const signature = signatures[mimeType];
    if (!signature) return false;

    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        return false;
      }
    }

    return true;
  }

  getProviderName(): string {
    return 'coze';
  }

  async isAvailable(): Promise<boolean> {
    try {
      // 检查API配置
      if (!this.apiToken || !this.workflowId) {
        return false;
      }

      // 进行简单的API健康检查（可选）
      // 这里可以调用一个轻量级的API端点来验证连接
      return true;
    } catch {
      return false;
    }
  }
}