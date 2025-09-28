#!/usr/bin/env node

/**
 * 简化的API测试执行器
 * 不依赖外部测试框架，直接测试真实API
 */

import { createApp } from './tests/helpers/app-helper'
import { TestDataFactory } from './tests/fixtures/test-data-factory'

interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
  details?: any
}

interface TestSuite {
  name: string
  results: TestResult[]
  passCount: number
  failCount: number
  totalDuration: number
}

class SimpleTestRunner {
  private suites: TestSuite[] = []
  private app: any

  constructor() {
    this.app = createApp()
  }

  async runAllTests(): Promise<void> {
    console.log('\n🚀 AI图像提示生成器 - 简化API测试执行器')
    console.log('=' .repeat(80))
    console.log(`⏰ 开始时间: ${new Date().toLocaleString('zh-CN')}`)
    console.log(`🔧 测试模式: 真实Coze API集成测试`)
    console.log(`📍 API端点: http://localhost:3000/api/analyze-image`)

    // 检查环境配置
    await this.checkEnvironment()

    // 执行测试套件
    await this.runBasicFunctionalityTests()
    await this.runErrorHandlingTests()
    await this.runPerformanceTests()

    // 生成报告
    this.generateReport()
  }

  private async checkEnvironment(): Promise<void> {
    console.log('\n📋 环境检查')
    console.log('-'.repeat(50))

    const requiredEnvVars = [
      'AI_SERVICE_PROVIDER',
      'COZE_API_TOKEN',
      'COZE_WORKFLOW_ID'
    ]

    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar]
      const status = value ? '✅' : '❌'
      const displayValue = envVar.includes('TOKEN') ? '***' : value
      console.log(`   ${status} ${envVar}: ${displayValue || '未设置'}`)
    }

    if (!process.env.COZE_API_TOKEN) {
      console.log('⚠️ 警告: 缺少API凭证，测试可能失败')
    }
  }

  private async runBasicFunctionalityTests(): Promise<void> {
    const suite: TestSuite = {
      name: '基础功能测试',
      results: [],
      passCount: 0,
      failCount: 0,
      totalDuration: 0
    }

    console.log('\n🧪 执行基础功能测试')
    console.log('-'.repeat(50))

    const testImages = TestDataFactory.createTestImageSet()

    // 测试1: 标准JPEG图片分析
    await this.runTest(suite, '标准JPEG图片分析', async () => {
      const imageData = testImages.standardJpeg
      const response = await this.app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .expect(200)

      if (!response.body.success) {
        throw new Error(`分析失败: ${response.body.error}`)
      }

      if (!response.body.data.prompt || response.body.data.prompt.length < 10) {
        throw new Error('生成的提示词过短')
      }

      return {
        promptLength: response.body.data.prompt.length,
        confidence: response.body.data.confidence,
        processingTime: response.body.data.processingTimeMs
      }
    })

    // 测试2: PNG图片支持
    await this.runTest(suite, 'PNG图片格式支持', async () => {
      const imageData = testImages.largePng
      const response = await this.app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .expect(200)

      if (!response.body.success) {
        throw new Error(`PNG分析失败: ${response.body.error}`)
      }

      return {
        format: 'PNG',
        size: imageData.size,
        success: true
      }
    })

    // 测试3: 风格参数映射
    await this.runTest(suite, '风格参数映射验证', async () => {
      const imageData = testImages.standardJpeg
      const styles = ['photographic', 'artistic', 'creative']
      const results = []

      for (const style of styles) {
        const response = await this.app
          .post('/api/analyze-image')
          .attach('image', imageData.buffer, {
            filename: imageData.filename,
            contentType: imageData.mimeType
          })
          .field('style', style)
          .expect(200)

        if (!response.body.success) {
          throw new Error(`风格${style}测试失败`)
        }

        results.push({
          style,
          promptLength: response.body.data.prompt.length
        })
      }

      return { testedStyles: results.length, styles: results }
    })

    this.suites.push(suite)
  }

  private async runErrorHandlingTests(): Promise<void> {
    const suite: TestSuite = {
      name: '错误处理测试',
      results: [],
      passCount: 0,
      failCount: 0,
      totalDuration: 0
    }

    console.log('\n🛡️ 执行错误处理测试')
    console.log('-'.repeat(50))

    // 测试1: 无效文件类型
    await this.runTest(suite, '无效文件类型处理', async () => {
      const invalidFile = Buffer.from('This is not an image')
      const response = await this.app
        .post('/api/analyze-image')
        .attach('image', invalidFile, {
          filename: 'test.txt',
          contentType: 'text/plain'
        })

      // 应该返回400或类似的错误状态
      if (response.status === 200) {
        throw new Error('应该拒绝无效文件类型')
      }

      return {
        status: response.status,
        errorHandled: true
      }
    })

    // 测试2: 空文件处理
    await this.runTest(suite, '空文件处理', async () => {
      const emptyBuffer = Buffer.alloc(0)
      const response = await this.app
        .post('/api/analyze-image')
        .attach('image', emptyBuffer, {
          filename: 'empty.jpg',
          contentType: 'image/jpeg'
        })

      if (response.status === 200 && response.body.success) {
        throw new Error('应该拒绝空文件')
      }

      return {
        status: response.status,
        properlyRejected: true
      }
    })

    // 测试3: 超大文件处理
    await this.runTest(suite, '超大文件处理', async () => {
      const largeBuffer = Buffer.alloc(20 * 1024 * 1024) // 20MB
      const response = await this.app
        .post('/api/analyze-image')
        .attach('image', largeBuffer, {
          filename: 'large.jpg',
          contentType: 'image/jpeg'
        })

      // 应该有大小限制
      if (response.status === 200 && response.body.success) {
        return {
          accepted: true,
          note: '系统接受了大文件，可能需要检查大小限制'
        }
      }

      return {
        status: response.status,
        sizeLimitEnforced: true
      }
    })

    this.suites.push(suite)
  }

  private async runPerformanceTests(): Promise<void> {
    const suite: TestSuite = {
      name: '性能测试',
      results: [],
      passCount: 0,
      failCount: 0,
      totalDuration: 0
    }

    console.log('\n⚡ 执行性能测试')
    console.log('-'.repeat(50))

    const testImages = TestDataFactory.createTestImageSet()

    // 测试1: 响应时间基准
    await this.runTest(suite, '响应时间基准测试', async () => {
      const imageData = testImages.standardJpeg
      const startTime = Date.now()

      const response = await this.app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .expect(200)

      const responseTime = Date.now() - startTime

      if (!response.body.success) {
        throw new Error('性能测试API调用失败')
      }

      // 检查是否在合理时间内响应（60秒）
      const isWithinSLA = responseTime < 60000

      return {
        responseTime,
        slaCompliant: isWithinSLA,
        processingTime: response.body.data.processingTimeMs,
        promptLength: response.body.data.prompt.length
      }
    })

    // 测试2: 内存使用监控
    await this.runTest(suite, '内存使用监控', async () => {
      const beforeMemory = process.memoryUsage()
      const imageData = testImages.largePng

      const response = await this.app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .expect(200)

      const afterMemory = process.memoryUsage()
      const memoryDelta = afterMemory.heapUsed - beforeMemory.heapUsed

      return {
        memoryDelta,
        beforeHeap: beforeMemory.heapUsed,
        afterHeap: afterMemory.heapUsed,
        memoryEfficient: memoryDelta < 100 * 1024 * 1024 // 小于100MB增长
      }
    })

    this.suites.push(suite)
  }

  private async runTest(
    suite: TestSuite,
    name: string,
    testFunction: () => Promise<any>
  ): Promise<void> {
    const startTime = Date.now()
    process.stdout.write(`   🔄 ${name}... `)

    try {
      const result = await testFunction()
      const duration = Date.now() - startTime

      suite.results.push({
        name,
        passed: true,
        duration,
        details: result
      })
      suite.passCount++
      suite.totalDuration += duration

      console.log(`✅ (${duration}ms)`)
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      suite.results.push({
        name,
        passed: false,
        duration,
        error: errorMessage
      })
      suite.failCount++
      suite.totalDuration += duration

      console.log(`❌ (${duration}ms)`)
      console.log(`      错误: ${errorMessage}`)
    }
  }

  private generateReport(): void {
    console.log('\n📊 测试结果汇总')
    console.log('=' .repeat(80))

    let totalTests = 0
    let totalPassed = 0
    let totalDuration = 0

    for (const suite of this.suites) {
      totalTests += suite.results.length
      totalPassed += suite.passCount
      totalDuration += suite.totalDuration

      console.log(`\n📋 ${suite.name}`)
      console.log(`   测试数量: ${suite.results.length}`)
      console.log(`   通过: ${suite.passCount} | 失败: ${suite.failCount}`)
      console.log(`   执行时间: ${suite.totalDuration}ms`)
      console.log(`   成功率: ${Math.round(suite.passCount / suite.results.length * 100)}%`)
    }

    console.log('\n🎯 整体统计')
    console.log('-'.repeat(50))
    console.log(`   总测试数: ${totalTests}`)
    console.log(`   通过: ${totalPassed}`)
    console.log(`   失败: ${totalTests - totalPassed}`)
    console.log(`   总执行时间: ${totalDuration}ms`)
    console.log(`   整体成功率: ${Math.round(totalPassed / totalTests * 100)}%`)

    // 生成质量评估
    this.generateQualityAssessment(totalPassed, totalTests)

    console.log('\n' + '='.repeat(80))
    console.log(`✅ 测试执行完成 - ${new Date().toLocaleString('zh-CN')}`)
  }

  private generateQualityAssessment(passed: number, total: number): void {
    const successRate = Math.round(passed / total * 100)

    console.log('\n🏆 质量评估')
    console.log('-'.repeat(50))

    if (successRate >= 90) {
      console.log('   🌟 优秀 (90%+) - 系统质量达到生产标准')
    } else if (successRate >= 80) {
      console.log('   ✅ 良好 (80-89%) - 系统基本满足要求')
    } else if (successRate >= 70) {
      console.log('   ⚠️ 一般 (70-79%) - 需要改进部分功能')
    } else {
      console.log('   🔴 需要改进 (<70%) - 存在重要问题需要修复')
    }

    console.log(`   测试通过率: ${successRate}%`)
    console.log(`   Coze API集成: ${process.env.AI_SERVICE_PROVIDER === 'coze' ? '✅' : '❌'}`)
    console.log(`   环境配置: ${process.env.COZE_API_TOKEN ? '✅' : '❌'}`)
  }
}

// 执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new SimpleTestRunner()
  runner.runAllTests().catch(error => {
    console.error('\n❌ 测试执行失败:', error)
    process.exit(1)
  })
}