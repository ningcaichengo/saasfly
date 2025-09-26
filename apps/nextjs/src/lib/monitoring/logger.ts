// 监控和日志系统

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

export interface AnalyticsEvent {
  name: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  properties: Record<string, any>;
}

class Logger {
  private currentLogLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor() {
    this.currentLogLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLogLevel;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
    };
  }

  private log(entry: LogEntry): void {
    // 添加到内存日志
    this.logs.push(entry);

    // 保持日志数量限制
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 输出到控制台（开发环境）
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(entry);
    }

    // 发送到外部服务（生产环境）
    if (process.env.NODE_ENV === 'production' && entry.level >= LogLevel.ERROR) {
      this.sendToExternalService(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] ${LogLevel[entry.level]}`;
    const context = entry.context ? ` [${entry.context}]` : '';
    const message = `${prefix}${context}: ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(message, entry.data);
        break;
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // 在生产环境中，这里可以发送到 Sentry、LogRocket 等服务
    try {
      // 示例：发送到外部日志服务
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // });
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  private getCurrentUserId(): string | undefined {
    // 在实际应用中，从认证状态获取用户ID
    return undefined;
  }

  private getSessionId(): string {
    // 获取或创建会话ID
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('sessionId', sessionId);
      }
      return sessionId;
    }
    return 'server_session';
  }

  debug(message: string, context?: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log(this.createLogEntry(LogLevel.DEBUG, message, context, data));
    }
  }

  info(message: string, context?: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log(this.createLogEntry(LogLevel.INFO, message, context, data));
    }
  }

  warn(message: string, context?: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log(this.createLogEntry(LogLevel.WARN, message, context, data));
    }
  }

  error(message: string, context?: string, data?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.log(this.createLogEntry(LogLevel.ERROR, message, context, data));
    }
  }

  // 获取最近的日志
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // 清除日志
  clearLogs(): void {
    this.logs = [];
  }
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private maxEvents: number = 500;

  private createEvent(name: string, properties: Record<string, any>): AnalyticsEvent {
    return {
      name,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      properties,
    };
  }

  private getCurrentUserId(): string | undefined {
    return undefined; // 实际应用中从认证状态获取
  }

  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('sessionId', sessionId);
      }
      return sessionId;
    }
    return 'server_session';
  }

  track(eventName: string, properties: Record<string, any> = {}): void {
    const event = this.createEvent(eventName, properties);

    // 添加到内存
    this.events.push(event);

    // 保持事件数量限制
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // 发送到分析服务
    this.sendToAnalyticsService(event);

    // 开发环境日志
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${eventName}:`, properties);
    }
  }

  private async sendToAnalyticsService(event: AnalyticsEvent): Promise<void> {
    try {
      // 在生产环境中，这里可以发送到 PostHog、Google Analytics 等
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event),
      // });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  // AI 图像分析特定事件
  trackImageAnalysisStarted(fileSize: number, fileType: string): void {
    this.track('image_analysis_started', {
      file_size: fileSize,
      file_type: fileType,
    });
  }

  trackImageAnalysisCompleted(
    provider: string,
    processingTime: number,
    success: boolean,
    errorCode?: string
  ): void {
    this.track('image_analysis_completed', {
      provider,
      processing_time: processingTime,
      success,
      error_code: errorCode,
    });
  }

  trackPromptCopied(promptLength: number, provider: string): void {
    this.track('prompt_copied', {
      prompt_length: promptLength,
      provider,
    });
  }

  trackPromptEdited(originalLength: number, editedLength: number): void {
    this.track('prompt_edited', {
      original_length: originalLength,
      edited_length: editedLength,
      change_ratio: editedLength / originalLength,
    });
  }

  getRecentEvents(count: number = 50): AnalyticsEvent[] {
    return this.events.slice(-count);
  }
}

// 单例导出
export const logger = new Logger();
export const analytics = new Analytics();