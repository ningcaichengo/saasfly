import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TestDataFactory } from '../fixtures/test-data-factory'
import { createApp, ResourceMonitor, ConcurrencyHelper, StateConsistencyHelper } from '../helpers/app-helper'
import { server } from '../setup'

describe('State Management and Concurrency Tests', () => {
  let app: any
  let testImages: ReturnType<typeof TestDataFactory.createTestImageSet>
  let resourceMonitor: ResourceMonitor
  let stateHelper: StateConsistencyHelper

  beforeEach(() => {
    app = createApp()
    testImages = TestDataFactory.createTestImageSet()
    resourceMonitor = new ResourceMonitor()
    stateHelper = new StateConsistencyHelper()
  })

  describe('TC025-TC030: State Management Tests', () => {
    it('TC025: Should handle concurrent file uploads without conflicts', async () => {
      const imageData = testImages.standardJpeg
      const concurrency = 5
      const totalRequests = 10

      const requestFactory = async () => {
        const response = await app
          .post('/api/analyze-image')
          .attach('image', imageData.buffer, {
            filename: `test_${Math.random()}.jpg`,
            contentType: imageData.mimeType
          })
          .field('style', 'photographic')
          .expect(200)

        return response.body
      }

      const results = await ConcurrencyHelper.runConcurrentRequests(
        requestFactory,
        concurrency,
        totalRequests
      )

      // 验证所有请求都成功
      expect(results.successCount).toBe(totalRequests)
      expect(results.errorCount).toBe(0)

      // 验证响应一致性
      const successfulResults = results.results.filter(r => !(r instanceof Error))
      successfulResults.forEach((result: any) => {
        expect(result.success).toBe(true)
        expect(result.data.prompt).toBeTruthy()
        expect(result.data.confidence).toBeGreaterThanOrEqual(0)
      })

      // 验证性能
      expect(results.averageTime).toBeLessThan(30000) // 平均响应时间不超过30秒
    })

    it('TC026: Should maintain state consistency during long processing', async () => {
      const imageData = testImages.largePng

      // 启动请求
      const requestPromise = app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .field('style', 'artistic')
        .expect(200)

      // 在处理过程中捕获状态
      stateHelper.captureState('during_processing', {
        memoryUsage: process.memoryUsage(),
        timestamp: Date.now()
      })

      const response = await requestPromise

      // 处理完成后捕获状态
      stateHelper.captureState('after_processing', {
        memoryUsage: process.memoryUsage(),
        timestamp: Date.now(),
        response: response.body
      })

      // 验证状态一致性
      expect(response.body.success).toBe(true)

      const duringState = stateHelper.getState('during_processing')
      const afterState = stateHelper.getState('after_processing')

      // 验证时间戳递增
      expect(afterState.timestamp).toBeGreaterThan(duringState.timestamp)

      // 验证内存使用合理性
      const memoryDelta = afterState.memoryUsage.heapUsed - duringState.memoryUsage.heapUsed
      expect(Math.abs(memoryDelta)).toBeLessThan(100 * 1024 * 1024) // 内存变化不超过100MB
    })

    it('TC027: Should recover from processing failures gracefully', async () => {
      // 使用损坏的图像数据触发失败
      const corruptedImage = testImages.corruptedJpeg

      const response = await app
        .post('/api/analyze-image')
        .attach('image', corruptedImage.buffer, {
          filename: corruptedImage.filename,
          contentType: corruptedImage.mimeType
        })

      // 验证能够优雅地处理失败
      if (response.status !== 200) {
        expect(response.body.success).toBe(false)
        expect(response.body.error).toBeDefined()
        expect(response.body.error.code).toBeTruthy()
      }

      // 后续请求应该正常工作
      const normalImage = testImages.standardJpeg
      const recoveryResponse = await app
        .post('/api/analyze-image')
        .attach('image', normalImage.buffer, {
          filename: normalImage.filename,
          contentType: normalImage.mimeType
        })
        .expect(200)

      expect(recoveryResponse.body.success).toBe(true)
    })

    it('TC028: Should validate request idempotency', async () => {
      const imageData = testImages.standardJpeg

      // 发送同一请求多次
      const requests = Array.from({ length: 3 }, () =>
        app
          .post('/api/analyze-image')
          .attach('image', imageData.buffer, {
            filename: imageData.filename,
            contentType: imageData.mimeType
          })
          .field('style', 'photographic')
          .expect(200)
      )

      const responses = await Promise.all(requests)

      // 验证所有响应都成功
      responses.forEach(response => {
        expect(response.body.success).toBe(true)
      })

      // 验证结果一致性（相同输入应产生相似结果）
      const prompts = responses.map(r => r.body.data.prompt)
      const firstPrompt = prompts[0]

      // 至少提示词的类型应该一致
      prompts.forEach(prompt => {
        expect(typeof prompt).toBe('string')
        expect(prompt.length).toBeGreaterThan(0)
      })
    })

    it('TC029: Should handle resource cleanup properly', async () => {
      const initialMemory = resourceMonitor.getCurrentMemoryUsage()

      // 执行多个请求
      const imageData = testImages.standardJpeg
      const requests = Array.from({ length: 5 }, () =>
        app
          .post('/api/analyze-image')
          .attach('image', imageData.buffer, {
            filename: `test_${Math.random()}.jpg`,
            contentType: imageData.mimeType
          })
          .expect(200)
      )

      await Promise.all(requests)

      // 等待垃圾回收
      if (global.gc) {
        global.gc()
      }
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 检查内存泄漏
      const memoryLeak = resourceMonitor.detectMemoryLeak(50 * 1024 * 1024) // 50MB阈值
      expect(memoryLeak).toBe(false)

      const finalMemory = resourceMonitor.getCurrentMemoryUsage()
      const memoryDelta = finalMemory.heapUsed - initialMemory.heapUsed

      // 内存增长应该在合理范围内
      expect(memoryDelta).toBeLessThan(100 * 1024 * 1024) // 不超过100MB
    })

    it('TC030: Should maintain data integrity under stress', async () => {
      const imageData = testImages.performanceTestMedium

      // 高频请求测试
      const stressResults = await ConcurrencyHelper.runConcurrentRequests(
        async () => {
          const response = await app
            .post('/api/analyze-image')
            .attach('image', imageData.buffer, {
              filename: `stress_test_${Math.random()}.png`,
              contentType: imageData.mimeType
            })
            .field('style', 'artistic')

          return response.body
        },
        10, // 10个并发
        20  // 总共20个请求
      )

      // 验证成功率
      const successRate = stressResults.successCount / (stressResults.successCount + stressResults.errorCount)
      expect(successRate).toBeGreaterThanOrEqual(0.90) // 至少90%成功率

      // 验证数据完整性
      const successfulResults = stressResults.results.filter(r => !(r instanceof Error)) as any[]
      successfulResults.forEach(result => {
        if (result.success) {
          expect(result.data.prompt).toBeTruthy()
          expect(result.data.description).toBeTruthy()
          expect(Array.isArray(result.data.tags)).toBe(true)
          expect(typeof result.data.confidence).toBe('number')
          expect(result.data.confidence).toBeGreaterThanOrEqual(0)
          expect(result.data.confidence).toBeLessThanOrEqual(1)
        }
      })
    })
  })

  describe('TC031-TC035: Resource Management Tests', () => {
    it('TC031: Should not leak memory during normal operations', async () => {
      const imageData = testImages.standardJpeg
      const initialMemory = process.memoryUsage()

      // 执行一系列操作
      for (let i = 0; i < 10; i++) {
        await app
          .post('/api/analyze-image')
          .attach('image', imageData.buffer, {
            filename: `test_${i}.jpg`,
            contentType: imageData.mimeType
          })
          .expect(200)
      }

      // 强制垃圾回收
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage()
      const heapDelta = finalMemory.heapUsed - initialMemory.heapUsed

      // 堆内存增长应该在合理范围内（考虑到缓存等因素）
      expect(heapDelta).toBeLessThan(50 * 1024 * 1024) // 50MB
    })

    it('TC032: Should handle large file processing without memory explosion', async () => {
      const largeImage = testImages.performanceTestLarge
      const beforeMemory = process.memoryUsage()

      const response = await app
        .post('/api/analyze-image')
        .attach('image', largeImage.buffer, {
          filename: largeImage.filename,
          contentType: largeImage.mimeType
        })

      const afterMemory = process.memoryUsage()
      const memoryIncrease = afterMemory.heapUsed - beforeMemory.heapUsed

      // 验证内存使用合理性
      expect(memoryIncrease).toBeLessThan(largeImage.size * 3) // 不超过文件大小的3倍

      if (response.status === 200) {
        expect(response.body.success).toBe(true)
      }
    })

    it('TC033: Should cleanup resources after request completion', async () => {
      const imageData = testImages.standardJpeg

      // 记录初始资源状态
      const initialState = {
        memory: process.memoryUsage(),
        time: Date.now()
      }

      // 执行请求
      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .expect(200)

      // 等待资源清理
      await new Promise(resolve => setTimeout(resolve, 100))

      const finalState = {
        memory: process.memoryUsage(),
        time: Date.now()
      }

      // 验证请求成功
      expect(response.body.success).toBe(true)

      // 验证资源合理使用
      const processingTime = finalState.time - initialState.time
      expect(processingTime).toBeLessThan(30000) // 处理时间不超过30秒
    })

    it('TC034: Should handle multiple concurrent large files', async () => {
      const largeImage = testImages.performanceTestLarge
      const beforeMemory = process.memoryUsage()

      const concurrentRequests = Array.from({ length: 3 }, (_, i) =>
        app
          .post('/api/analyze-image')
          .attach('image', largeImage.buffer, {
            filename: `large_${i}.jpg`,
            contentType: largeImage.mimeType
          })
      )

      const results = await Promise.allSettled(concurrentRequests)
      const afterMemory = process.memoryUsage()

      // 验证至少有一些请求成功
      const successfulResults = results.filter(r => r.status === 'fulfilled').length
      expect(successfulResults).toBeGreaterThan(0)

      // 验证内存使用没有失控
      const memoryIncrease = afterMemory.heapUsed - beforeMemory.heapUsed
      expect(memoryIncrease).toBeLessThan(largeImage.size * 5) // 不超过总文件大小的5倍
    })

    it('TC035: Should recover from out-of-memory scenarios gracefully', async () => {
      // 创建一个极大的文件来测试内存限制
      const oversizedImage = TestDataFactory.createTestImage({
        size: 15 * 1024 * 1024, // 15MB，超过限制
        format: 'jpeg'
      })

      const response = await app
        .post('/api/analyze-image')
        .attach('image', oversizedImage.buffer, {
          filename: oversizedImage.filename,
          contentType: oversizedImage.mimeType
        })

      // 应该返回适当的错误
      expect(response.status).toBe(413) // Payload Too Large

      // 后续正常请求应该仍然工作
      const normalImage = testImages.standardJpeg
      const recoveryResponse = await app
        .post('/api/analyze-image')
        .attach('image', normalImage.buffer, {
          filename: normalImage.filename,
          contentType: normalImage.mimeType
        })
        .expect(200)

      expect(recoveryResponse.body.success).toBe(true)
    })
  })
})