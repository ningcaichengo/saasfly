import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // 🔐 认证和支付
    STRIPE_API_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    CLERK_SECRET_KEY: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    RESEND_FROM: z.string().email().optional(),
    ADMIN_EMAIL: z.string().optional(),

    // 🤖 AI服务配置 (生产环境必需)
    AI_SERVICE_PROVIDER: z.enum(['coze', 'openai', 'mock']).default('mock'),
    COZE_API_TOKEN: z.string().min(1).optional(),
    COZE_API_BASE_URL: z.string().url().optional(),
    COZE_WORKFLOW_ID: z.string().min(1).optional(),
    OPENAI_API_KEY: z.string().min(1).optional(),
    OPENAI_API_BASE_URL: z.string().url().optional(),
    OPENAI_MODEL: z.string().optional(),

    // 📁 文件处理配置
    MAX_FILE_SIZE_MB: z.coerce.number().min(1).max(50).default(10),
    ALLOWED_FILE_TYPES: z.string().default('jpg,jpeg,png,webp'),

    // 🛡️ 安全配置
    ENABLE_RATE_LIMITING: z.string().transform(val => val === 'true').default('false'),
    ENABLE_CACHING: z.string().transform(val => val === 'true').default('false'),
    ENABLE_CORS_PROTECTION: z.string().transform(val => val === 'true').default('false'),
    ENABLE_CSP_HEADERS: z.string().transform(val => val === 'true').default('false'),
    ENABLE_SECURITY_HEADERS: z.string().transform(val => val === 'true').default('false'),

    // 🚦 速率限制配置
    RATE_LIMIT_PER_MINUTE: z.coerce.number().min(1).max(1000).default(10),
    RATE_LIMIT_PER_HOUR: z.coerce.number().min(1).max(10000).default(100),
    RATE_LIMIT_PER_DAY: z.coerce.number().min(1).max(100000).default(1000),

    // 🗄️ 数据库配置
    POSTGRES_URL: z.string().url().optional(),
    DATABASE_URL: z.string().url().optional(),
    DB_POOL_MIN: z.coerce.number().min(1).default(2),
    DB_POOL_MAX: z.coerce.number().min(1).default(10),
    DB_TIMEOUT: z.coerce.number().min(1000).default(30000),

    // 📊 监控配置
    SENTRY_DSN: z.string().url().optional(),
    SENTRY_ENVIRONMENT: z.string().optional(),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    ENABLE_DEBUG_LOGS: z.string().transform(val => val === 'true').default('false'),
    ENABLE_PERFORMANCE_MONITORING: z.string().transform(val => val === 'true').default('false'),
    PERFORMANCE_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),

    // ☁️ 云服务配置
    REDIS_URL: z.string().url().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_S3_BUCKET: z.string().optional(),
    AWS_REGION: z.string().default('us-east-1'),

    // 🔧 应用配置
    CACHE_MAX_AGE: z.coerce.number().min(60).default(3600),
    CDN_URL: z.string().url().optional(),

    // 其他
    IS_DEBUG: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1).optional(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_STRIPE_PRO_PRODUCT_ID: z.string().optional(),
    NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID: z.string().optional(),
    NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID: z.string().optional(),
    NEXT_PUBLIC_STRIPE_BUSINESS_PRODUCT_ID: z.string().optional(),
    NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID: z.string().optional(),
    NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
  },
  runtimeEnv: {
    // 🔐 认证和支付
    STRIPE_API_KEY: process.env.STRIPE_API_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM: process.env.RESEND_FROM,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,

    // 🤖 AI服务配置
    AI_SERVICE_PROVIDER: process.env.AI_SERVICE_PROVIDER,
    COZE_API_TOKEN: process.env.COZE_API_TOKEN,
    COZE_API_BASE_URL: process.env.COZE_API_BASE_URL,
    COZE_WORKFLOW_ID: process.env.COZE_WORKFLOW_ID,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_API_BASE_URL: process.env.OPENAI_API_BASE_URL,
    OPENAI_MODEL: process.env.OPENAI_MODEL,

    // 📁 文件处理配置
    MAX_FILE_SIZE_MB: process.env.MAX_FILE_SIZE_MB,
    ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES,

    // 🛡️ 安全配置
    ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING,
    ENABLE_CACHING: process.env.ENABLE_CACHING,
    ENABLE_CORS_PROTECTION: process.env.ENABLE_CORS_PROTECTION,
    ENABLE_CSP_HEADERS: process.env.ENABLE_CSP_HEADERS,
    ENABLE_SECURITY_HEADERS: process.env.ENABLE_SECURITY_HEADERS,

    // 🚦 速率限制配置
    RATE_LIMIT_PER_MINUTE: process.env.RATE_LIMIT_PER_MINUTE,
    RATE_LIMIT_PER_HOUR: process.env.RATE_LIMIT_PER_HOUR,
    RATE_LIMIT_PER_DAY: process.env.RATE_LIMIT_PER_DAY,

    // 🗄️ 数据库配置
    POSTGRES_URL: process.env.POSTGRES_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    DB_POOL_MIN: process.env.DB_POOL_MIN,
    DB_POOL_MAX: process.env.DB_POOL_MAX,
    DB_TIMEOUT: process.env.DB_TIMEOUT,

    // 📊 监控配置
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT,
    LOG_LEVEL: process.env.LOG_LEVEL,
    ENABLE_DEBUG_LOGS: process.env.ENABLE_DEBUG_LOGS,
    ENABLE_PERFORMANCE_MONITORING: process.env.ENABLE_PERFORMANCE_MONITORING,
    PERFORMANCE_SAMPLE_RATE: process.env.PERFORMANCE_SAMPLE_RATE,

    // ☁️ 云服务配置
    REDIS_URL: process.env.REDIS_URL,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    AWS_REGION: process.env.AWS_REGION,

    // 🔧 应用配置
    CACHE_MAX_AGE: process.env.CACHE_MAX_AGE,
    CDN_URL: process.env.CDN_URL,

    // 其他
    IS_DEBUG: process.env.IS_DEBUG,

    // 客户端环境变量
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_STRIPE_PRO_PRODUCT_ID: process.env.NEXT_PUBLIC_STRIPE_PRO_PRODUCT_ID,
    NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
    NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
    NEXT_PUBLIC_STRIPE_BUSINESS_PRODUCT_ID: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRODUCT_ID,
    NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID,
    NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },
});
