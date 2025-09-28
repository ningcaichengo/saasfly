import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { match as matchLocale } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

import { i18n } from "~/config/i18n-config";

// 🛡️ 安全配置
interface SecurityConfig {
  enableCORS: boolean;
  enableCSP: boolean;
  enableRateLimit: boolean;
  rateLimit: {
    perMinute: number;
    perHour: number;
  };
  allowedOrigins: string[];
}

// 速率限制存储 (生产环境应使用Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// 从环境变量获取安全配置
const getSecurityConfig = (): SecurityConfig => ({
  enableCORS: process.env.ENABLE_CORS_PROTECTION === 'true',
  enableCSP: process.env.ENABLE_CSP_HEADERS === 'true',
  enableRateLimit: process.env.ENABLE_RATE_LIMITING === 'true',
  rateLimit: {
    perMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '10'),
    perHour: parseInt(process.env.RATE_LIMIT_PER_HOUR || '100'),
  },
  allowedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://your-domain.com',
    'https://www.your-domain.com',
  ].filter(Boolean),
});

const publicRoute = [
  "/(\\w{2}/)?signin(.*)",
  "/(\\w{2}/)?sign-in(.*)",
  "/(\\w{2}/)?sign-up(.*)",
  "/(\\w{2}/)?terms(.*)",
  "/(\\w{2}/)?privacy(.*)",
  "/(\\w{2}/)?docs(.*)",
  "/(\\w{2}/)?blog(.*)",
  "/(\\w{2}/)?pricing(.*)",
  "^/\\w{2}$", // root with locale
];

const noNeedProcessRoute = [".*\\.png", ".*\\.jpg", ".*\\.opengraph-image.png"];
const noRedirectRoute = ["/api(.*)", "/trpc(.*)", "/admin"];

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/en',
  '/zh',
  '/en/(.*)',
  '/zh/(.*)',
  '/api/webhooks/(.*)',
  '/api/trpc/(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/terms(.*)',
  '/privacy(.*)',
  '/docs(.*)',
  '/blog(.*)',
  '/pricing(.*)'
])

// Define admin routes
const isAdminRoute = createRouteMatcher([
  '/admin/dashboard(.*)'
])

function getLocale(request: NextRequest): string | undefined {
  // Negotiator expects plain object so we need to transform headers
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));
  const locales = Array.from(i18n.locales);
  // Use negotiator and intl-localematcher to get best locale
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(
    locales,
  );
  return matchLocale(languages, locales, i18n.defaultLocale);
}

function isNoRedirect(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  return noRedirectRoute.some((route) => new RegExp(route).test(pathname));
}

function isPublicPage(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  return publicRoute.some((route) => new RegExp(route).test(pathname));
}

function isNoNeedProcess(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  return noNeedProcessRoute.some((route) => new RegExp(route).test(pathname));
}

export default function middleware(req: NextRequest) {
  const config = getSecurityConfig();

  // Skip processing for static assets
  if (isNoNeedProcess(req)) {
    return NextResponse.next();
  }

  // Always allow webhooks
  const isWebhooksRoute = req.nextUrl.pathname.startsWith("/api/webhooks/");
  if (isWebhooksRoute) {
    return NextResponse.next();
  }

  // 🛡️ 应用速率限制 (仅对API路由)
  if (config.enableRateLimit && req.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResponse = applyRateLimit(req, config);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // 创建响应
  let response = NextResponse.next();

  const pathname = req.nextUrl.pathname;

  // Check if there is any supported locale in the pathname
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) =>
      !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
  );

  // Redirect if there is no locale
  if (!isNoRedirect(req) && pathnameIsMissingLocale) {
    const locale = getLocale(req);
    response = NextResponse.redirect(
      new URL(
        `/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`,
        req.url,
      ),
    );
  }

  // 🛡️ 应用安全标头
  response = addSecurityHeaders(response, config);

  // 🛡️ 应用CORS策略
  if (config.enableCORS) {
    response = applyCORS(req, response, config);
  }

  return response;
}

/**
 * 🛡️ 添加安全标头
 */
function addSecurityHeaders(response: NextResponse, config: SecurityConfig): NextResponse {
  // 基础安全标头
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // HTTPS强制 (生产环境)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // 权限策略
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  // 内容安全策略 (CSP)
  if (config.enableCSP) {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://cdn.vercel-insights.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' data: blob:",
      "connect-src 'self' https://api.coze.cn https://api.openai.com https://clerk.*.com https://vercel.live wss:",
      "frame-src 'self' https://clerk.*.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);
  }

  return response;
}

/**
 * 🛡️ 应用CORS策略
 */
function applyCORS(req: NextRequest, response: NextResponse, config: SecurityConfig): NextResponse {
  const origin = req.headers.get('origin');
  const isAllowedOrigin = !origin || config.allowedOrigins.includes(origin);

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
  }

  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers });
  }

  return response;
}

/**
 * 🛡️ 应用速率限制
 */
function applyRateLimit(
  req: NextRequest,
  config: SecurityConfig
): NextResponse | null {
  const ip = getClientIP(req);
  const now = Date.now();

  // 获取或创建速率限制记录
  const key = `rate_limit:${ip}`;
  let record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // 重置计数器 (每分钟重置)
    record = {
      count: 0,
      resetTime: now + 60 * 1000, // 1分钟后重置
    };
  }

  record.count++;
  rateLimitStore.set(key, record);

  // 检查是否超过限制
  if (record.count > config.rateLimit.perMinute) {
    console.warn(`Rate limit exceeded for IP: ${ip}`);

    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': config.rateLimit.perMinute.toString(),
          'X-RateLimit-Remaining': Math.max(0, config.rateLimit.perMinute - record.count).toString(),
          'X-RateLimit-Reset': Math.ceil(record.resetTime / 1000).toString(),
        },
      }
    );
  }

  return null;
}

/**
 * 🛡️ 获取客户端IP地址
 */
function getClientIP(req: NextRequest): string {
  // 检查常见的代理标头
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  // 回退到连接IP
  return req.ip || 'unknown';
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}