# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在AI图像提示生成器项目中工作时提供指导。始终输出中文交流。

## 项目概述

**AI图像提示生成器** 是一个现代化的Web应用程序，专门为AI艺术创作者和设计师提供智能的提示词生成、编辑和优化服务。项目采用Next.js 14构建，提供直观的用户界面和流畅的交互体验。

### 核心功能
- **智能提示词生成**: 基于用户输入和图像分析生成高质量AI艺术提示词
- **可视化编辑器**: 实时预览和编辑提示词，支持语法高亮和智能建议
- **风格选择器**: 多种AI绘画风格模板（Midjourney、Stable Diffusion、Flux等）
- **图像上传与分析**: 支持图像上传，提取特征生成相关提示词
- **一键复制分享**: 快速复制和分享生成的提示词

### 项目特色
- **零登录要求**: 无需注册即可使用全部功能
- **响应式设计**: 完美适配桌面端、平板和移动设备
- **现代化UI**: 采用emerald绿色主题，简洁优雅的设计语言
- **高性能**: 优化的组件架构，快速响应和流畅交互

## 技术架构

### 核心技术栈
- **前端框架**: Next.js 14 (App Directory)
- **开发语言**: TypeScript 5.4+
- **样式方案**: Tailwind CSS + shadcn/ui 组件库
- **状态管理**: React 18 内置hooks + Zustand (复杂状态)
- **构建工具**: Turbo (Turborepo) + Bun
- **代码质量**: ESLint + Prettier + TypeScript strict模式

### 项目结构
```
apps/nextjs/                    # 主应用程序
├── src/
│   ├── app/                    # Next.js App Directory
│   │   ├── [lang]/            # 国际化路由
│   │   └── globals.css        # 全局样式
│   ├── components/            # React组件库
│   │   ├── prompt-generator/  # 核心功能组件
│   │   │   ├── control-panel.tsx      # 控制面板
│   │   │   ├── image-preview.tsx      # 图像预览
│   │   │   ├── prompt-editor.tsx      # 提示词编辑器
│   │   │   └── style-selector.tsx     # 风格选择器
│   │   ├── ui/               # 基础UI组件
│   │   └── layout/           # 布局组件
│   └── lib/                  # 工具函数和配置
packages/                      # 共享包
├── ui/                       # shadcn/ui组件库
├── tailwind-config/          # Tailwind配置
├── typescript-config/        # TypeScript配置
└── eslint-config/           # ESLint配置
```

### 组件架构设计
- **原子化组件**: 基于shadcn/ui的基础组件
- **复合组件**: 业务逻辑组件，组合多个原子组件
- **页面组件**: 完整功能页面，整合多个复合组件
- **Hook抽象**: 自定义hooks处理状态逻辑和副作用

## 开发环境配置

### 环境要求
- Node.js >= 18
- Bun >= 1.2.22 (包管理器)
- 现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+)

### 快速启动
```bash
# 1. 克隆项目
git clone <repository-url>
cd saasfly

# 2. 安装依赖
bun install

# 3. 启动开发服务器
bun run dev

# 4. 访问应用
# http://localhost:3000 (默认端口)
# http://localhost:13000 (自定义端口)
```

### 开发命令
```bash
# 开发模式 (推荐)
bun run dev              # 启动完整开发环境
bun run dev:web          # 仅启动Web应用

# 代码质量
bun run lint             # ESLint检查
bun run lint:fix         # 自动修复ESLint问题
bun run typecheck        # TypeScript类型检查
bun run format           # Prettier格式化
bun run format:fix       # 自动格式化代码

# 构建部署
bun run build            # 生产环境构建
bun run start            # 启动生产版本

# 工具命令
bun run clean            # 清理node_modules
bun run clean:workspaces # 清理所有工作区
bun run gen              # Turbo代码生成器
```

## React组件开发规范

### TypeScript严格类型
```typescript
// ✅ 推荐: 严格定义Props类型
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', ...props }: ButtonProps) {
  // 组件实现
}

// ❌ 避免: 使用any或缺少类型定义
export function Button(props: any) { /* ... */ }
```

### Hooks使用规范
```typescript
// ✅ 推荐: 自定义hook命名和结构
function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      // 上传逻辑
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { isUploading, error, uploadImage };
}
```

### 组件文件组织
```typescript
// 文件: components/prompt-generator/image-preview.tsx
"use client";

// 1. 外部导入
import { useState, useRef } from "react";
import { Button } from "@saasfly/ui/button";

// 2. 类型定义
interface ImagePreviewProps {
  onImageChange?: (file: File) => void;
  className?: string;
}

// 3. 组件实现
export function ImagePreview({ onImageChange, className }: ImagePreviewProps) {
  // hooks
  // 事件处理
  // render
}

// 4. 默认导出(如果需要)
export default ImagePreview;
```

### 状态管理策略
```typescript
// ✅ 简单状态: 使用useState
const [isVisible, setIsVisible] = useState(false);

// ✅ 复杂状态: 使用useReducer
const [state, dispatch] = useReducer(promptReducer, initialState);

// ✅ 全局状态: 使用Zustand
interface PromptStore {
  prompts: string[];
  selectedStyle: string;
  addPrompt: (prompt: string) => void;
  setStyle: (style: string) => void;
}

const usePromptStore = create<PromptStore>((set) => ({
  prompts: [],
  selectedStyle: 'general',
  addPrompt: (prompt) => set((state) => ({
    prompts: [...state.prompts, prompt]
  })),
  setStyle: (style) => set({ selectedStyle: style }),
}));
```

## UI/UX一致性标准

### Emerald主题色彩系统
```css
/* 主色调 */
--emerald-50: #ecfdf5;   /* 背景色 */
--emerald-100: #d1fae5;  /* 浅色背景 */
--emerald-200: #a7f3d0;  /* 边框色 */
--emerald-300: #6ee7b7;  /* 悬停边框 */
--emerald-500: #10b981;  /* 主按钮 */
--emerald-600: #059669;  /* 按钮悬停 */
--emerald-700: #047857;  /* 深色文字 */
--emerald-800: #065f46;  /* 标题文字 */
--emerald-900: #064e3b;  /* 最深文字 */
```

### 响应式设计原则
```typescript
// ✅ 推荐: Mobile-first响应式设计
<div className="w-full md:w-1/2 lg:w-1/3 xl:w-1/4">
  <Button className="w-full md:w-auto">
    {/* 移动端全宽，桌面端自适应 */}
  </Button>
</div>

// ✅ 推荐: 响应式字体和间距
<h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl">
  <span className="block md:inline">响应式标题</span>
</h1>
```

### 交互反馈规范
```typescript
// ✅ 推荐: 完整的交互状态
<Button
  className={cn(
    "transition-all duration-200",
    "hover:bg-emerald-600 hover:shadow-lg",
    "active:scale-95 active:bg-emerald-700",
    "focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    isLoading && "animate-pulse"
  )}
  disabled={isLoading}
>
  {isLoading ? (
    <>
      <LoadingSpinner className="mr-2" />
      处理中...
    </>
  ) : (
    <>
      <Icon className="mr-2" />
      按钮文字
    </>
  )}
</Button>
```

### 可访问性(a11y)要求
```typescript
// ✅ 必需: 键盘导航支持
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  onClick={handleClick}
>

// ✅ 必需: 语义化HTML和ARIA标签
<div role="region" aria-label="提示词编辑器">
  <textarea
    aria-describedby="prompt-help"
    aria-label="输入AI图像提示词"
    placeholder="在此输入提示词..."
  />
  <div id="prompt-help" className="sr-only">
    支持拖拽调整大小，按Ctrl+Enter快速生成
  </div>
</div>
```

## SMART交互流程

### S - Specification (规格确认)
每个开发任务开始前，我会主动确认：

**功能需求确认**
- 具体功能描述和预期行为
- 用户交互流程和边界条件
- 数据输入输出格式要求

**设计规范确认**
- UI/UX视觉要求和布局偏好
- 颜色主题和品牌一致性
- 响应式设计和设备兼容性

**技术约束确认**
- 性能要求和加载时间期望
- 浏览器兼容性要求
- 现有技术栈和组件限制

### M - Methodology (方法选择)
技术方案选择阶段的标准流程：

**方案评估框架**
```markdown
## 方案对比
| 方案 | 优点 | 缺点 | 复杂度 | 推荐度 |
|------|------|------|--------|--------|
| A    | ... | ... | 低     | ⭐⭐⭐ |
| B    | ... | ... | 中     | ⭐⭐   |
| C    | ... | ... | 高     | ⭐     |

## 推荐方案: A
理由: 平衡了功能需求和实现复杂度...
```

**技术选择原则**
1. **优先使用现有技术栈** - 减少学习成本和依赖复杂度
2. **性能优先** - 选择对用户体验影响最小的方案
3. **可维护性** - 代码简洁、逻辑清晰、易于调试
4. **扩展性** - 支持未来功能扩展和迭代

### A - Action (行动执行)
实施阶段采用增量式开发：

**开发步骤模板**
```markdown
## 实施计划
### Phase 1: 核心功能 (30分钟)
- [ ] 基础组件结构搭建
- [ ] 核心逻辑实现
- [ ] 基本样式应用

### Phase 2: 交互优化 (20分钟)
- [ ] 用户交互反馈
- [ ] 错误处理机制
- [ ] 性能优化

### Phase 3: 完善提升 (10分钟)
- [ ] 可访问性优化
- [ ] 代码清理和注释
- [ ] 测试验证
```

**进度汇报机制**
- 每个Phase完成后提供预览截图
- 遇到技术难点及时反馈和讨论
- 主动询问中间结果是否符合预期

### R - Review (审查验证)
验证阶段的质量检查清单：

**功能验证**
- [ ] 核心功能正常工作
- [ ] 边界条件处理正确
- [ ] 错误场景优雅降级
- [ ] 用户交互流畅自然

**代码质量**
- [ ] TypeScript类型安全
- [ ] ESLint规则通过
- [ ] 组件职责清晰
- [ ] 性能指标达标

**设计一致性**
- [ ] emerald主题色彩正确
- [ ] 响应式布局适配
- [ ] 交互反馈及时
- [ ] 可访问性支持

### T - Transfer (知识转移)
完成阶段的知识管理：

**文档更新**
- 更新组件使用说明
- 记录设计决策和原因
- 添加最佳实践示例
- 标记已知问题和待优化点

**经验总结**
- 技术方案的优缺点分析
- 开发过程中的经验教训
- 可复用的代码模式和工具函数
- 为类似需求提供参考模板

## AI组件开发指导

### 智能交互组件特殊考虑

**状态复杂性管理**
```typescript
// AI组件通常涉及多个状态
interface AIComponentState {
  // 用户输入状态
  userInput: string;
  inputErrors: string[];

  // AI处理状态
  isProcessing: boolean;
  processingStage: 'analyzing' | 'generating' | 'optimizing';

  // 结果状态
  results: AIResult[];
  selectedResult: string | null;

  // 交互状态
  isEditing: boolean;
  hasUnsavedChanges: boolean;
}
```

**用户体验优化**
- **即时反馈**: 用户操作后立即显示loading状态
- **进度指示**: 长时间处理显示进度条或阶段提示
- **错误恢复**: 提供重试机制和错误解释
- **结果预览**: 实时预览和编辑功能

**性能考虑**
```typescript
// 防抖优化用户输入
const debouncedAnalyze = useCallback(
  debounce(async (input: string) => {
    if (input.length < 3) return;
    await analyzeInput(input);
  }, 500),
  []
);

// 虚拟化长列表
import { FixedSizeList as List } from 'react-window';

function ResultsList({ items }: { items: AIResult[] }) {
  return (
    <List
      height={400}
      itemCount={items.length}
      itemSize={80}
    >
      {({ index, style }) => (
        <div style={style}>
          <ResultItem item={items[index]} />
        </div>
      )}
    </List>
  );
}
```

### 提示词处理专门逻辑
```typescript
// 提示词语法解析和高亮
function parsePrompt(text: string) {
  const tokens = [];
  const regex = /(\[.*?\]|\(.*?\)|\<.*?\>|--\w+\s+[\w.]+|\b[A-Z]+\b)/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // 添加普通文本
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      });
    }

    // 添加特殊语法
    tokens.push({
      type: getTokenType(match[1]),
      content: match[1]
    });

    lastIndex = regex.lastIndex;
  }

  // 添加剩余文本
  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  return tokens;
}
```

## 测试与调试策略

### 单元测试规范
```typescript
// 组件测试示例
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PromptEditor } from './prompt-editor';

describe('PromptEditor', () => {
  it('应该正确渲染默认提示词', () => {
    render(<PromptEditor />);
    expect(screen.getByDisplayValue(/stunning PHOTOGRAPH/)).toBeInTheDocument();
  });

  it('应该支持编辑模式切换', async () => {
    render(<PromptEditor />);

    const editableArea = screen.getByRole('textbox');
    fireEvent.click(editableArea);

    await waitFor(() => {
      expect(editableArea).toHaveClass('border-emerald-500');
    });
  });

  it('应该正确处理复制功能', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn() }
    });

    render(<PromptEditor />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });
});
```

### 集成测试策略
```typescript
// E2E测试场景
describe('AI提示词生成完整流程', () => {
  it('用户应该能够完成提示词生成和编辑', async () => {
    // 1. 上传图像
    await uploadTestImage('astronaut-cat.jpg');

    // 2. 选择风格
    await selectStyle('Midjourney');

    // 3. 生成提示词
    await clickGenerateButton();
    await waitForGeneration();

    // 4. 编辑提示词
    await editPrompt('添加更多细节描述...');

    // 5. 复制结果
    await copyPrompt();

    // 验证最终结果
    expect(await getClipboardContent()).toContain('astronaut cat');
  });
});
```

### 调试工具配置
```typescript
// 开发环境调试helpers
if (process.env.NODE_ENV === 'development') {
  // React DevTools性能分析
  import('react-dom').then(({ Profiler }) => {
    // 性能监控配置
  });

  // 状态调试工具
  window.debugPromptState = () => {
    console.log('Current prompt state:', usePromptStore.getState());
  };

  // 组件重渲染监控
  const useRenderCount = (componentName: string) => {
    const renderCount = useRef(0);
    renderCount.current += 1;
    console.log(`${componentName} rendered: ${renderCount.current} times`);
  };
}
```

## 性能优化指南

### React组件性能
```typescript
// 1. memo优化
const ExpensiveComponent = memo(({ data }: Props) => {
  return <div>{/* 复杂渲染逻辑 */}</div>;
});

// 2. useMemo缓存计算
const PromptAnalyzer = ({ text }: { text: string }) => {
  const analysis = useMemo(() => {
    return analyzePromptComplexity(text);
  }, [text]);

  return <div>{analysis.summary}</div>;
};

// 3. useCallback优化事件处理
const ImageUploader = () => {
  const handleUpload = useCallback(async (file: File) => {
    // 上传逻辑
  }, []);

  return <DropZone onUpload={handleUpload} />;
};
```

### 图像处理优化
```typescript
// 图像压缩和优化
async function optimizeImage(file: File): Promise<File> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = new Image();

  return new Promise((resolve) => {
    img.onload = () => {
      // 计算最优尺寸
      const maxWidth = 1200;
      const maxHeight = 800;
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // 绘制并压缩
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    };

    img.src = URL.createObjectURL(file);
  });
}
```

### 打包优化配置
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 图像优化
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  // 代码分割
  experimental: {
    optimizePackageImports: ['@saasfly/ui', 'lucide-react'],
  },

  // 压缩优化
  compress: true,

  // 静态资源优化
  assetPrefix: process.env.NODE_ENV === 'production' ? '/cdn' : '',
};

module.exports = nextConfig;
```

### 性能监控
```typescript
// 性能指标追踪
function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name.includes(componentName)) {
          console.log(`${componentName} performance:`, {
            duration: entry.duration,
            startTime: entry.startTime,
          });
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });

    return () => observer.disconnect();
  }, [componentName]);
}

// Web Vitals监控
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function setupWebVitals() {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
}
```

## 团队协作规范

### 代码审查检查清单

**功能完整性** ✅
- [ ] 功能需求完全实现
- [ ] 边界条件正确处理
- [ ] 错误场景优雅处理
- [ ] 用户体验流畅

**代码质量** ✅
- [ ] TypeScript类型完整
- [ ] ESLint规则通过
- [ ] 函数职责单一
- [ ] 变量命名清晰
- [ ] 注释适度有效

**性能标准** ✅
- [ ] 组件渲染优化
- [ ] 内存泄漏检查
- [ ] 图像资源优化
- [ ] 网络请求合理

**设计一致性** ✅
- [ ] emerald主题正确
- [ ] 响应式布局完整
- [ ] 交互反馈及时
- [ ] 可访问性支持

### Git提交规范
```bash
# 提交格式
<type>(<scope>): <description>

# 类型说明
feat: 新功能
fix: 错误修复
refactor: 代码重构
style: 样式调整
test: 测试相关
docs: 文档更新
chore: 构建配置

# 示例
feat(prompt-editor): 添加虚线边框可编辑样式
fix(image-upload): 修复文件类型验证问题
style(control-panel): 调整按钮居中对齐
refactor(hooks): 提取通用状态管理逻辑
```

### 文档维护流程
**实时更新原则**
- 新功能完成后立即更新相关文档
- 重构代码时同步更新架构说明
- 修复问题后补充已知问题列表
- 性能优化后更新性能指标

**版本管理**
```markdown
## 更新记录
### v1.2.0 (2024-12-XX)
- ✨ 新增: 虚线边框可编辑提示词功能
- 🐛 修复: 图像悬停文字可见性问题
- 💄 优化: Control Panel布局对齐方式
- 📝 文档: 完善SMART交互流程说明

### v1.1.0 (2024-12-XX)
- ✨ 新增: 现代化图像上传交互
- 🎨 优化: emerald绿色主题统一
- ⚡ 性能: 组件渲染优化
```

### 最佳实践库

**常用代码模式**
```typescript
// 1. 通用Loading状态组件
export function LoadingState({ message = "处理中..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mr-3" />
      <span className="text-emerald-700">{message}</span>
    </div>
  );
}

// 2. 错误边界组件
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold mb-2">出现了一些问题</h3>
          <p className="text-red-600">请刷新页面重试，如果问题持续请联系技术支持。</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// 3. 通用表单验证hook
function useFormValidation<T>(initialValues: T, validationRules: ValidationRules<T>) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validate = useCallback(() => {
    const newErrors: Partial<Record<keyof T, string>> = {};

    Object.keys(validationRules).forEach((key) => {
      const rule = validationRules[key as keyof T];
      const value = values[key as keyof T];
      const error = rule(value);
      if (error) newErrors[key as keyof T] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validationRules]);

  return { values, setValues, errors, validate };
}
```

**组件设计模式**
```typescript
// Compound Component模式
const Accordion = {
  Root: AccordionRoot,
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
};

// 使用方式
<Accordion.Root>
  <Accordion.Item value="item-1">
    <Accordion.Trigger>触发器</Accordion.Trigger>
    <Accordion.Content>内容区域</Accordion.Content>
  </Accordion.Item>
</Accordion.Root>

// Render Props模式
<DataProvider>
  {({ data, loading, error }) => (
    <>
      {loading && <LoadingState />}
      {error && <ErrorMessage error={error} />}
      {data && <DataView data={data} />}
    </>
  )}
</DataProvider>
```

---

## 快速参考

### 常用命令速查
```bash
# 开发环境
bun run dev          # 启动开发服务器
bun run dev:web      # 仅启动Web应用

# 代码质量
bun run lint         # 代码检查
bun run format:fix   # 自动格式化
bun run typecheck    # 类型检查

# 构建部署
bun run build        # 生产构建
bun run start        # 启动生产版本
```

### 关键文件路径
```
src/components/prompt-generator/  # 核心功能组件
src/components/ui/               # 基础UI组件
packages/ui/                     # shadcn/ui组件库
CLAUDE.md                       # 开发指导文档
turbo.json                      # Turborepo配置
```

### 联系方式
遇到问题或需要协作时，请：
1. 检查本文档的相关章节
2. 查看组件源码和注释
3. 运行相关的调试命令
4. 参考最佳实践示例

---

**文档版本**: v2.0.0
**更新时间**: 2024-12-XX
**适用项目**: AI图像提示生成器
**维护者**: Claude Code Assistant