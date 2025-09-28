# =============================================================================
# 🐳 AI图像提示生成器 - Docker生产环境构建
# =============================================================================
# 多阶段构建确保最小化最终镜像大小并提高安全性
# =============================================================================

# -----------------------------------------------------------------------------
# 📦 Stage 1: Dependencies - 安装依赖
# -----------------------------------------------------------------------------
FROM node:18-alpine AS deps

# 添加必要的系统依赖
RUN apk add --no-cache libc6-compat

# 设置工作目录
WORKDIR /app

# 复制包管理文件
COPY package.json bun.lockb* ./
COPY apps/nextjs/package.json ./apps/nextjs/
COPY packages/*/package.json ./packages/*/

# 安装bun
RUN npm install -g bun

# 安装依赖 (仅生产依赖)
RUN bun install --frozen-lockfile --production

# -----------------------------------------------------------------------------
# 🏗️ Stage 2: Builder - 构建应用
# -----------------------------------------------------------------------------
FROM node:18-alpine AS builder

# 添加必要的系统依赖
RUN apk add --no-cache libc6-compat git

WORKDIR /app

# 安装bun
RUN npm install -g bun

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置构建环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1

# 构建应用
RUN cd apps/nextjs && bun run build

# -----------------------------------------------------------------------------
# 🚀 Stage 3: Runner - 运行时环境
# -----------------------------------------------------------------------------
FROM node:18-alpine AS runner

# 创建非root用户提高安全性
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 复制必要的文件
COPY --from=builder /app/apps/nextjs/public ./public

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/apps/nextjs/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/nextjs/.next/static ./apps/nextjs/.next/static

# 创建必要的目录
RUN mkdir -p /app/tmp && chown nextjs:nodejs /app/tmp

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动应用
CMD ["node", "apps/nextjs/server.js"]

# =============================================================================
# 📋 构建和运行指令:
# =============================================================================
# 构建镜像:
# docker build -t ai-prompt-generator .
#
# 运行容器:
# docker run -p 3000:3000 --env-file .env.production ai-prompt-generator
#
# 开发环境构建:
# docker build --target runner -t ai-prompt-generator:dev .
# =============================================================================