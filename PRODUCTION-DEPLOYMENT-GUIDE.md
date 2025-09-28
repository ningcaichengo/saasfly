# 🚀 AI图像提示生成器 - 生产环境部署指南

## 📋 概述

本指南将引导您完成AI图像提示生成器从开发到生产环境的完整部署流程。我们已经为您准备了企业级的配置和安全措施。

### 🎯 部署前检查清单

- [ ] 所有环境变量已配置
- [ ] API密钥已更换为生产密钥
- [ ] 域名和DNS已配置
- [ ] SSL证书已申请
- [ ] 数据库已准备
- [ ] 监控系统已配置

---

## 📊 系统架构

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   CloudFlare    │───▶│  Next.js App │───▶│   Coze API      │
│   (CDN/WAF)     │    │   (Vercel)   │    │   (AI Service)  │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │                       │                    │
         ▼                       ▼                    │
┌─────────────────┐    ┌──────────────┐              │
│   Static Assets │    │  PostgreSQL  │              │
│   (Optimized)   │    │  (Database)  │              │
└─────────────────┘    └──────────────┘              │
                                │                     │
                                ▼                     │
                    ┌──────────────┐                  │
                    │   Monitoring │                  │
                    │ (Sentry/Logs)│◀─────────────────┘
                    └──────────────┘
```

---

## 🔐 环境配置

### 1. 生产环境变量设置

复制 `.env.production` 文件并替换所有占位符：

```bash
# 1. 复制模板文件
cp .env.production .env.production.local

# 2. 编辑生产配置
nano .env.production.local
```

**⚠️ 重要替换项目：**
- `NEXT_PUBLIC_APP_URL`: 您的生产域名
- `COZE_API_TOKEN`: 生产环境Coze API密钥
- `CLERK_SECRET_KEY`: 生产环境Clerk密钥
- `STRIPE_API_KEY`: 生产环境Stripe密钥
- `POSTGRES_URL`: 生产数据库连接字符串

### 2. 安全配置验证

```bash
# 启用所有安全功能
ENABLE_RATE_LIMITING=true
ENABLE_CORS_PROTECTION=true
ENABLE_CSP_HEADERS=true
ENABLE_SECURITY_HEADERS=true

# 生产级限流设置
RATE_LIMIT_PER_MINUTE=5
RATE_LIMIT_PER_HOUR=50
RATE_LIMIT_PER_DAY=200
```

---

## 🌐 部署方式

### 方式1: Vercel部署 (推荐)

#### 📋 Vercel部署步骤

1. **准备代码仓库**
```bash
# 确保代码已推送到GitHub
git add .
git commit -m "Production ready deployment"
git push origin main
```

2. **Vercel项目配置**
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 部署项目
vercel --prod
```

3. **环境变量配置**
在Vercel Dashboard中设置所有生产环境变量，或使用CLI：

```bash
# 批量导入环境变量
vercel env pull .env.vercel.local
```

4. **域名配置**
```bash
# 添加自定义域名
vercel domains add your-domain.com
vercel domains add www.your-domain.com
```

#### 🔧 Vercel项目设置

**Project Settings → General:**
- Framework Preset: `Next.js`
- Root Directory: `apps/nextjs`
- Build Command: `cd ../.. && bun run build`
- Output Directory: `apps/nextjs/.next`
- Install Command: `bun install`

**Project Settings → Functions:**
- Region: 选择距离用户最近的区域
- Runtime: `nodejs18.x`

### 方式2: Docker部署

#### 🐳 Docker生产部署

1. **构建生产镜像**
```bash
# 构建优化镜像
docker build -t ai-prompt-generator:latest .

# 验证镜像
docker images ai-prompt-generator
```

2. **运行容器**
```bash
# 使用生产环境变量运行
docker run -d \
  --name ai-prompt-app \
  -p 3000:3000 \
  --env-file .env.production \
  --restart=unless-stopped \
  ai-prompt-generator:latest
```

3. **健康检查验证**
```bash
# 检查容器状态
docker ps
docker logs ai-prompt-app

# 验证健康检查
curl http://localhost:3000/api/health
```

#### 🎛️ Docker Compose部署

创建 `docker-compose.prod.yml`：

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

  redis:
    image: redis:alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

部署命令：
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🗄️ 数据库配置

### PostgreSQL生产设置

1. **创建生产数据库**
```sql
-- 创建数据库
CREATE DATABASE ai_prompt_generator_prod;

-- 创建用户
CREATE USER prod_user WITH ENCRYPTED PASSWORD 'secure_password';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE ai_prompt_generator_prod TO prod_user;
```

2. **运行数据库迁移**
```bash
# 如果使用Prisma
npx prisma migrate deploy

# 如果使用其他ORM，运行相应的迁移命令
```

3. **数据库连接池配置**
```bash
# 生产级连接池设置
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_TIMEOUT=30000
```

---

## 🛡️ 安全配置

### 1. SSL/TLS证书

**使用Let's Encrypt（免费）:**
```bash
# 安装certbot
sudo apt install certbot

# 申请证书
sudo certbot certonly --webroot -w /var/www/html -d your-domain.com -d www.your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. 防火墙配置

```bash
# UFW配置示例
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. 速率限制

系统已内置速率限制，生产环境配置：
- **每分钟**: 5次请求
- **每小时**: 50次请求
- **每天**: 200次请求

### 4. CORS配置

已配置严格的CORS策略，只允许指定域名访问。

---

## 📊 监控和日志

### 1. 健康检查端点

系统提供详细的健康检查：
```bash
# 检查应用健康状态
curl https://your-domain.com/api/health

# 响应示例：
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": 3600,
  "services": {
    "database": "up",
    "aiService": "up",
    "cache": "up"
  }
}
```

### 2. 错误监控 (Sentry)

1. **配置Sentry**
```bash
# 在.env.production中设置
SENTRY_DSN='https://your-sentry-dsn@sentry.io/project-id'
SENTRY_ENVIRONMENT='production'
```

2. **测试错误追踪**
```bash
# 访问不存在的页面来测试
curl https://your-domain.com/non-existent-page
```

### 3. 性能监控

内置性能监控配置：
```bash
ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_SAMPLE_RATE=0.1
```

### 4. 日志管理

```bash
# 查看应用日志
docker logs ai-prompt-app

# 实时日志监控
docker logs -f ai-prompt-app

# 日志级别配置
LOG_LEVEL=info
ENABLE_DEBUG_LOGS=false
```

---

## 🔄 CI/CD配置

### GitHub Actions工作流

创建 `.github/workflows/deploy.yml`：

```yaml
name: Production Deployment

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Bun
      uses: oven-sh/setup-bun@v1
      with:
        bun-version: latest

    - name: Install dependencies
      run: bun install

    - name: Run tests
      run: bun run test

    - name: Build application
      run: cd apps/nextjs && bun run build

    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

### 必需的GitHub Secrets

在GitHub仓库设置中添加：
- `VERCEL_TOKEN`: Vercel访问令牌
- `ORG_ID`: Vercel组织ID
- `PROJECT_ID`: Vercel项目ID

---

## 🧪 生产验证

### 1. 功能测试检查清单

- [ ] 主页加载正常
- [ ] 图像上传功能工作
- [ ] AI提示词生成正常
- [ ] 错误处理正确显示
- [ ] 健康检查端点响应正常

### 2. 性能测试

```bash
# 使用Apache Bench进行负载测试
ab -n 100 -c 10 https://your-domain.com/

# 测试API端点
ab -n 50 -c 5 https://your-domain.com/api/health
```

### 3. 安全测试

```bash
# 检查SSL证书
curl -I https://your-domain.com

# 测试安全标头
curl -I https://your-domain.com | grep -E "(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection)"

# 测试速率限制
for i in {1..10}; do curl https://your-domain.com/api/analyze-image; done
```

---

## 🚨 故障排除

### 常见问题解决

#### 1. 构建失败
```bash
# 检查依赖
bun install

# 清理构建缓存
rm -rf .next node_modules
bun install
bun run build
```

#### 2. API调用失败
```bash
# 检查环境变量
echo $COZE_API_TOKEN

# 测试API连接
curl -H "Authorization: Bearer $COZE_API_TOKEN" https://api.coze.cn/v1/workflow/list
```

#### 3. 数据库连接问题
```bash
# 测试数据库连接
psql $POSTGRES_URL -c "SELECT 1;"

# 检查连接池
echo "连接池配置: MIN=$DB_POOL_MIN, MAX=$DB_POOL_MAX"
```

#### 4. 内存问题
```bash
# 监控内存使用
docker stats ai-prompt-app

# 增加Node.js内存限制
NODE_OPTIONS="--max-old-space-size=4096"
```

### 紧急回滚流程

**Vercel回滚:**
```bash
# 查看部署历史
vercel list

# 回滚到上一个版本
vercel rollback [deployment-url]
```

**Docker回滚:**
```bash
# 停止当前容器
docker stop ai-prompt-app

# 启动备份镜像
docker run -d --name ai-prompt-app-backup ai-prompt-generator:backup
```

---

## 📈 性能优化建议

### 1. CDN配置

使用CloudFlare或类似CDN服务：
- 启用Brotli压缩
- 配置缓存规则
- 启用Image Optimization

### 2. 缓存策略

```bash
# Redis缓存配置
REDIS_URL='redis://username:password@redis-host:6379'
ENABLE_CACHING=true
CACHE_MAX_AGE=3600
```

### 3. 图像优化

- 启用WebP/AVIF格式
- 配置图像CDN
- 实施懒加载

---

## 📞 技术支持

### 监控端点
- **健康检查**: `https://your-domain.com/api/health`
- **应用状态**: `https://your-domain.com/api/status`

### 关键指标监控
- 响应时间 < 2秒
- 错误率 < 1%
- 可用性 > 99.9%
- CPU使用率 < 80%
- 内存使用率 < 85%

### 告警配置
建议为以下情况设置告警：
- API响应时间超过5秒
- 错误率超过5%
- 健康检查失败
- 磁盘使用率超过90%

---

## 🎉 部署完成检查

部署完成后，请验证以下项目：

- [ ] ✅ 应用正常访问：`https://your-domain.com`
- [ ] ✅ API健康检查：`https://your-domain.com/api/health`
- [ ] ✅ 图像上传测试：上传测试图片并生成提示词
- [ ] ✅ 错误处理：访问不存在页面查看错误页面
- [ ] ✅ 安全标头：检查响应包含所有安全标头
- [ ] ✅ SSL证书：确认HTTPS正常工作
- [ ] ✅ 速率限制：测试API限流功能
- [ ] ✅ 监控告警：确认监控系统正常工作

**🎊 恭喜！您的AI图像提示生成器已成功部署到生产环境！**

---

*最后更新: 2024-12-27*
*版本: v1.0.0*
*维护者: Claude Code Assistant*