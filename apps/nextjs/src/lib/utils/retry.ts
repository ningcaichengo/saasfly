// 重试机制工具函数

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // 默认重试条件：网络错误、超时、服务不可用
    if (error?.status) {
      return [408, 429, 502, 503, 504].includes(error.status);
    }
    return true;
  }
};

export class RetryableError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // 如果这是最后一次尝试，抛出错误
      if (attempt === opts.maxRetries) {
        break;
      }

      // 检查是否应该重试
      if (!opts.retryCondition!(error)) {
        throw error;
      }

      // 计算延迟时间
      let delay = opts.baseDelay * Math.pow(opts.backoffFactor, attempt);
      delay = Math.min(delay, opts.maxDelay);

      // 如果服务器指定了重试时间，使用服务器指定的时间
      if (error instanceof RetryableError && error.retryAfter) {
        delay = error.retryAfter * 1000;
      }

      // 添加一些随机性以避免雷群效应
      delay = delay + Math.random() * 1000;

      console.log(
        `[Retry] Attempt ${attempt + 1}/${opts.maxRetries + 1} failed, retrying in ${Math.round(delay)}ms`,
        error
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// 专门用于API请求的重试函数
export async function retryApiRequest<T>(
  url: string,
  options: RequestInit,
  retryOptions: Partial<RetryOptions> = {}
): Promise<T> {
  return withRetry(async () => {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // 检查是否有重试时间头
      const retryAfter = response.headers.get('Retry-After');
      const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;

      throw new RetryableError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code,
        retryAfterSeconds
      );
    }

    return await response.json();
  }, retryOptions);
}