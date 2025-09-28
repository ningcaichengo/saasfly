import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

// 全局测试设置 - 使用真实API环境
beforeAll(() => {
  console.log('🚀 测试环境初始化：使用真实Coze API')

  // 确保使用真实的API配置
  process.env.NODE_ENV = 'test'
  process.env.AI_SERVICE_PROVIDER = 'coze'

  // 使用真实的API凭证（从环境变量读取）
  if (!process.env.COZE_API_TOKEN || !process.env.COZE_WORKFLOW_ID) {
    console.warn('⚠️ 警告：缺少Coze API配置，某些测试可能失败')
  }
})

// 每个测试后清理状态
afterEach(() => {
  // 清理测试状态但保持API配置
})

// 全局清理
afterAll(() => {
  console.log('✅ 测试环境清理完成')
})

// 全局测试工具
declare global {
  var testUtils: {
    createTestImage: (size: number, format: string) => Buffer
    measureMemoryUsage: () => Promise<NodeJS.MemoryUsage>
    waitForCondition: (condition: () => boolean, timeout: number) => Promise<void>
  }
}

global.testUtils = {
  createTestImage: (size: number, format: string): Buffer => {
    // 创建测试图像的简单实现
    const header = format === 'png' ?
      Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) :
      Buffer.from([0xFF, 0xD8, 0xFF])

    const padding = Buffer.alloc(Math.max(0, size - header.length))
    return Buffer.concat([header, padding])
  },

  measureMemoryUsage: async (): Promise<NodeJS.MemoryUsage> => {
    // 强制垃圾回收（如果可用）
    if (global.gc) {
      global.gc()
    }
    return process.memoryUsage()
  },

  waitForCondition: async (condition: () => boolean, timeout: number): Promise<void> => {
    const start = Date.now()
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`)
    }
  }
}