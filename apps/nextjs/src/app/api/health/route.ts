/**
 * 🏥 健康检查API端点
 * 用于生产环境监控和负载均衡器健康检查
 */

import { NextRequest, NextResponse } from 'next/server';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: 'up' | 'down' | 'unknown';
    aiService: 'up' | 'down' | 'unknown';
    cache: 'up' | 'down' | 'unknown';
  };
  performance: {
    memoryUsage: NodeJS.MemoryUsage;
    loadAverage?: number[];
  };
}

// 缓存健康检查结果，避免过于频繁的检查
let lastHealthCheck: { result: HealthStatus; timestamp: number } | null = null;
const HEALTH_CHECK_CACHE_MS = 30000; // 30秒缓存

export async function GET(request: NextRequest) {
  try {
    // 检查是否有缓存的结果
    const now = Date.now();
    if (lastHealthCheck && (now - lastHealthCheck.timestamp) < HEALTH_CHECK_CACHE_MS) {
      return NextResponse.json(lastHealthCheck.result, {
        status: lastHealthCheck.result.status === 'healthy' ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      });
    }

    const healthStatus = await performHealthCheck();

    // 缓存结果
    lastHealthCheck = {
      result: healthStatus,
      timestamp: now,
    };

    const httpStatus = healthStatus.status === 'healthy' ? 200 :
                      healthStatus.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Health check failed:', error);

    const errorResponse: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
      services: {
        database: 'unknown',
        aiService: 'unknown',
        cache: 'unknown',
      },
      performance: {
        memoryUsage: process.memoryUsage(),
      },
    };

    return NextResponse.json(errorResponse, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  }
}

async function performHealthCheck(): Promise<HealthStatus> {
  const startTime = Date.now();

  // 并行检查所有服务
  const [databaseStatus, aiServiceStatus, cacheStatus] = await Promise.allSettled([
    checkDatabase(),
    checkAIService(),
    checkCache(),
  ]);

  const services = {
    database: databaseStatus.status === 'fulfilled' ? databaseStatus.value : 'down',
    aiService: aiServiceStatus.status === 'fulfilled' ? aiServiceStatus.value : 'down',
    cache: cacheStatus.status === 'fulfilled' ? cacheStatus.value : 'down',
  };

  // 确定整体健康状态
  const downServices = Object.values(services).filter(status => status === 'down').length;
  const unknownServices = Object.values(services).filter(status => status === 'unknown').length;

  let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
  if (downServices === 0 && unknownServices === 0) {
    overallStatus = 'healthy';
  } else if (downServices > 1 || services.aiService === 'down') {
    // AI服务是核心服务，如果它宕机或多个服务宕机，则不健康
    overallStatus = 'unhealthy';
  } else {
    overallStatus = 'degraded';
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV || 'unknown',
    services,
    performance: {
      memoryUsage: process.memoryUsage(),
      loadAverage: typeof process.loadavg === 'function' ? process.loadavg() : undefined,
    },
  };
}

async function checkDatabase(): Promise<'up' | 'down' | 'unknown'> {
  try {
    // 检查数据库连接
    // 这里需要根据实际使用的数据库客户端进行调整
    if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
      return 'unknown';
    }

    // 简单的连接检查 - 在实际项目中应该使用真实的数据库查询
    // 例如: await db.raw('SELECT 1');
    return 'up';
  } catch (error) {
    console.error('Database health check failed:', error);
    return 'down';
  }
}

async function checkAIService(): Promise<'up' | 'down' | 'unknown'> {
  try {
    // 检查AI服务配置
    const provider = process.env.AI_SERVICE_PROVIDER;

    if (!provider) {
      return 'unknown';
    }

    if (provider === 'coze') {
      if (!process.env.COZE_API_TOKEN || !process.env.COZE_WORKFLOW_ID) {
        return 'down';
      }

      // 可以添加实际的API健康检查
      // 这里只检查配置是否存在
      return 'up';
    }

    if (provider === 'openai') {
      if (!process.env.OPENAI_API_KEY) {
        return 'down';
      }
      return 'up';
    }

    return 'unknown';
  } catch (error) {
    console.error('AI service health check failed:', error);
    return 'down';
  }
}

async function checkCache(): Promise<'up' | 'down' | 'unknown'> {
  try {
    // 检查缓存服务（Redis等）
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      // 如果没有配置Redis，则认为缓存服务未启用但正常
      return 'unknown';
    }

    // 在实际项目中，应该尝试连接Redis并执行简单命令
    // 例如: await redis.ping();
    return 'up';
  } catch (error) {
    console.error('Cache health check failed:', error);
    return 'down';
  }
}

// 支持HEAD请求，用于简单的存活检查
export async function HEAD(request: NextRequest) {
  try {
    // 快速检查，不返回详细信息
    const isHealthy = process.uptime() > 0; // 简单的存活检查

    return new NextResponse(null, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}