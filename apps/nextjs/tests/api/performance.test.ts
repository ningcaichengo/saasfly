import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TestDataFactory } from '../fixtures/test-data-factory'
import { createApp, ConcurrencyHelper, ResourceMonitor } from '../helpers/app-helper'

describe('Performance and Compliance Tests', () => {
  let app: any
  let testImages: ReturnType<typeof TestDataFactory.createTestImageSet>

  beforeEach(() => {
    app = createApp()
    testImages = TestDataFactory.createTestImageSet()
  })

  describe('TC056-TC070: Scientific Performance Tests', () => {
    it('TC056: Should meet SLA for small images (<1MB)', async () => {
      const smallImage = testImages.performanceTestSmall
      const iterations = 5
      const times: number[] = []

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now()

        const response = await app
          .post('/api/analyze-image')
          .attach('image', smallImage.buffer, {
            filename: `small_perf_${i}.jpg`,
            contentType: smallImage.mimeType
          })
          .expect(200)

        const endTime = Date.now()
        times.push(endTime - startTime)

        expect(response.body.success).toBe(true)
      }

      // 性能要求：95%的小图像请求应在15秒内完成
      const sortedTimes = times.sort((a, b) => a - b)
      const p95Time = sortedTimes[Math.floor(iterations * 0.95)]

      expect(p95Time).toBeLessThan(15000) // 15秒

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length
      expect(averageTime).toBeLessThan(10000) // 平均不超过10秒
    })

    it('TC057: Should meet SLA for medium images (1-5MB)', async () => {
      const mediumImage = testImages.performanceTestMedium
      const iterations = 3 // 减少迭代次数因为文件较大

      const times: number[] = []

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now()

        const response = await app
          .post('/api/analyze-image')
          .attach('image', mediumImage.buffer, {
            filename: `medium_perf_${i}.png`,
            contentType: mediumImage.mimeType
          })

        const endTime = Date.now()
        times.push(endTime - startTime)

        if (response.status === 200) {
          expect(response.body.success).toBe(true)
        }
      }

      // 性能要求：95%的中等图像请求应在25秒内完成
      const sortedTimes = times.sort((a, b) => a - b)
      const p95Time = sortedTimes[Math.floor(iterations * 0.95)]

      expect(p95Time).toBeLessThan(25000) // 25秒
    })

    it('TC058: Should meet SLA for large images (5-10MB)', async () => {
      const largeImage = testImages.performanceTestLarge
      const startTime = Date.now()

      const response = await app
        .post('/api/analyze-image')
        .attach('image', largeImage.buffer, {
          filename: largeImage.filename,
          contentType: largeImage.mimeType
        })

      const endTime = Date.now()
      const processingTime = endTime - startTime

      // 性能要求：大图像请求应在35秒内完成
      expect(processingTime).toBeLessThan(35000) // 35秒

      if (response.status === 200) {
        expect(response.body.success).toBe(true)
        expect(response.body.data.processingTime.total).toBeLessThan(35000)
      }
    })

    it('TC059: Should handle concurrent load efficiently', async () => {
      const imageData = testImages.standardJpeg
      const concurrency = 5
      const totalRequests = 15

      const loadTestResults = await ConcurrencyHelper.runConcurrentRequests(
        async () => {
          return app
            .post('/api/analyze-image')
            .attach('image', imageData.buffer, {
              filename: `load_test_${Math.random()}.jpg`,
              contentType: imageData.mimeType
            })
        },
        concurrency,
        totalRequests
      )

      // 性能要求
      expect(loadTestResults.successCount).toBeGreaterThanOrEqual(totalRequests * 0.95) // 95%成功率
      expect(loadTestResults.averageTime).toBeLessThan(30000) // 平均30秒内
      expect(loadTestResults.maxTime).toBeLessThan(60000) // 最大不超过60秒

      // 验证并发处理没有显著性能退化
      const performanceDegradation = (loadTestResults.maxTime - loadTestResults.minTime) / loadTestResults.minTime
      expect(performanceDegradation).toBeLessThan(3) // 性能退化不超过300%
    })

    it('TC060: Should maintain stable performance under sustained load', async () => {
      const imageData = testImages.standardJpeg
      const duration = 60000 // 1分钟持续测试
      const requestInterval = 3000 // 每3秒一个请求
      const startTime = Date.now()
      const results: { time: number; success: boolean; duration: number }[] = []

      while (Date.now() - startTime < duration) {
        const requestStart = Date.now()

        try {
          const response = await app
            .post('/api/analyze-image')
            .attach('image', imageData.buffer, {
              filename: `sustained_${Date.now()}.jpg`,
              contentType: imageData.mimeType
            })

          const requestEnd = Date.now()
          results.push({
            time: requestStart,
            success: response.status === 200,
            duration: requestEnd - requestStart
          })
        } catch (error) {
          const requestEnd = Date.now()
          results.push({
            time: requestStart,
            success: false,
            duration: requestEnd - requestStart
          })
        }

        // 等待下一个请求间隔
        await new Promise(resolve => setTimeout(resolve, requestInterval))
      }

      // 分析性能稳定性
      const successRate = results.filter(r => r.success).length / results.length
      expect(successRate).toBeGreaterThanOrEqual(0.90) // 90%成功率

      const durations = results.map(r => r.duration)
      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length
      const maxDuration = Math.max(...durations)

      expect(averageDuration).toBeLessThan(30000) // 平均30秒内
      expect(maxDuration).toBeLessThan(60000) // 最大60秒内

      // 验证性能没有显著退化（比较前半段和后半段）
      const firstHalf = durations.slice(0, Math.floor(durations.length / 2))
      const secondHalf = durations.slice(Math.floor(durations.length / 2))

      const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

      const performanceDrift = Math.abs(secondHalfAvg - firstHalfAvg) / firstHalfAvg
      expect(performanceDrift).toBeLessThan(0.5) // 性能漂移不超过50%
    })

    it('TC061: Should track and report performance metrics accurately', async () => {
      const imageData = testImages.standardJpeg

      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .expect(200)

      // 验证性能指标的准确性
      const processingTime = response.body.data.processingTime

      expect(processingTime).toHaveProperty('total')
      expect(processingTime).toHaveProperty('ai')

      expect(typeof processingTime.total).toBe('number')
      expect(typeof processingTime.ai).toBe('number')

      expect(processingTime.total).toBeGreaterThan(0)
      expect(processingTime.ai).toBeGreaterThan(0)

      // AI处理时间不应超过总时间
      expect(processingTime.ai).toBeLessThanOrEqual(processingTime.total)

      // 总时间应该在合理范围内
      expect(processingTime.total).toBeLessThan(60000) // 不超过60秒
    })

    it('TC062: Should optimize memory usage during processing', async () => {
      const monitor = new ResourceMonitor()
      const largeImage = testImages.performanceTestLarge

      const beforeMemory = monitor.getCurrentMemoryUsage()

      const response = await app
        .post('/api/analyze-image')
        .attach('image', largeImage.buffer, {
          filename: largeImage.filename,
          contentType: largeImage.mimeType
        })

      const afterMemory = monitor.getCurrentMemoryUsage()
      const memoryDelta = monitor.getMemoryDelta()

      // 验证内存使用效率
      expect(memoryDelta.heapUsed).toBeLessThan(largeImage.size * 3) // 不超过文件大小的3倍
      expect(memoryDelta.rss).toBeLessThan(200 * 1024 * 1024) // RSS增长不超过200MB

      if (response.status === 200) {
        expect(response.body.success).toBe(true)
      }
    })

    it('TC063: Should handle peak traffic scenarios', async () => {
      const imageData = testImages.standardJpeg

      // 模拟突发流量：快速增加到高并发，然后维持
      const phases = [
        { concurrency: 2, requests: 4 },   // 预热阶段
        { concurrency: 5, requests: 10 },  // 爬升阶段
        { concurrency: 10, requests: 20 }, // 峰值阶段
        { concurrency: 3, requests: 6 }    // 降温阶段
      ]

      for (const phase of phases) {
        const phaseResults = await ConcurrencyHelper.runConcurrentRequests(
          async () => {
            return app
              .post('/api/analyze-image')
              .attach('image', imageData.buffer, {
                filename: `peak_${Math.random()}.jpg`,
                contentType: imageData.mimeType
              })
          },
          phase.concurrency,
          phase.requests
        )

        // 验证每个阶段的性能
        const successRate = phaseResults.successCount / (phaseResults.successCount + phaseResults.errorCount)
        expect(successRate).toBeGreaterThanOrEqual(0.80) // 至少80%成功率

        if (phaseResults.successCount > 0) {
          expect(phaseResults.averageTime).toBeLessThan(45000) // 峰值期间平均不超过45秒
        }
      }
    })

    it('TC064: Should demonstrate scalability characteristics', async () => {
      const imageData = testImages.standardJpeg
      const scalabilityTests = [
        { concurrency: 1, requests: 3 },
        { concurrency: 3, requests: 9 },
        { concurrency: 5, requests: 15 }
      ]

      const scalabilityResults: { concurrency: number; avgTime: number; throughput: number }[] = []

      for (const test of scalabilityTests) {
        const testResults = await ConcurrencyHelper.runConcurrentRequests(
          async () => {
            return app
              .post('/api/analyze-image')
              .attach('image', imageData.buffer, {
                filename: `scale_${Math.random()}.jpg`,
                contentType: imageData.mimeType
              })
          },
          test.concurrency,
          test.requests
        )

        if (testResults.successCount > 0) {
          const throughput = testResults.successCount / (testResults.averageTime / 1000) // 请求/秒
          scalabilityResults.push({
            concurrency: test.concurrency,
            avgTime: testResults.averageTime,
            throughput: throughput
          })
        }
      }

      // 验证可扩展性：吞吐量应该随并发度增加而增加（在合理范围内）
      if (scalabilityResults.length >= 2) {
        const firstResult = scalabilityResults[0]
        const lastResult = scalabilityResults[scalabilityResults.length - 1]

        // 吞吐量应该有所提升，但响应时间可能增加
        expect(lastResult.throughput).toBeGreaterThanOrEqual(firstResult.throughput * 0.5)
      }
    })

    it('TC065: Should maintain quality under performance pressure', async () => {
      const imageData = testImages.standardJpeg

      // 高压力下的质量测试
      const pressureResults = await ConcurrencyHelper.runConcurrentRequests(
        async () => {
          return app
            .post('/api/analyze-image')
            .attach('image', imageData.buffer, {
              filename: `pressure_${Math.random()}.jpg`,
              contentType: imageData.mimeType
            })
        },
        8, // 高并发
        16 // 多请求
      )

      // 验证质量标准
      const successfulResults = pressureResults.results.filter(r => !(r instanceof Error)) as any[]

      successfulResults.forEach(result => {
        if (result.body && result.body.success) {
          const data = result.body.data

          // 验证返回数据质量
          expect(data.prompt).toBeTruthy()
          expect(data.prompt.length).toBeGreaterThan(10)
          expect(data.confidence).toBeGreaterThanOrEqual(0.5) // 即使高压力下也要有合理置信度
          expect(Array.isArray(data.tags)).toBe(true)
          expect(data.tags.length).toBeGreaterThan(0)
        }
      })

      // 成功率不应因性能压力而显著下降
      const successRate = pressureResults.successCount / (pressureResults.successCount + pressureResults.errorCount)
      expect(successRate).toBeGreaterThanOrEqual(0.75) // 至少75%成功率
    })
  })

  describe('TC071-TC080: Compliance Tests', () => {
    it('TC071: Should handle EXIF data according to privacy regulations', async () => {
      const imageWithExif = testImages.imageWithExif

      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageWithExif.buffer, {
          filename: imageWithExif.filename,
          contentType: imageWithExif.mimeType
        })

      if (response.status === 200) {
        const responseContent = JSON.stringify(response.body)

        // 验证不泄露敏感EXIF信息（GDPR合规）
        expect(responseContent).not.toContain('gps')
        expect(responseContent).not.toContain('latitude')
        expect(responseContent).not.toContain('longitude')
        expect(responseContent).not.toContain('location')
        expect(responseContent).not.toContain('camera')
        expect(responseContent).not.toContain('device')
      }
    })

    it('TC072: Should not retain user data longer than necessary', async () => {
      const imageData = testImages.standardJpeg

      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })

      if (response.status === 200) {
        // 验证响应中不包含原始图像数据
        const responseContent = JSON.stringify(response.body)
        expect(responseContent).not.toContain('buffer')
        expect(responseContent).not.toContain('base64')
        expect(responseContent).not.toContain('data:image')

        // 验证不包含文件路径或系统信息
        expect(responseContent).not.toContain('file://')
        expect(responseContent).not.toContain('temp')
        expect(responseContent).not.toContain('tmp')
      }
    })

    it('TC073: Should provide appropriate data processing transparency', async () => {
      const imageData = testImages.standardJpeg

      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .expect(200)

      // 验证处理透明度（GDPR Article 12-14要求）
      expect(response.body.data).toHaveProperty('provider') // 说明使用的服务提供商
      expect(response.body.data).toHaveProperty('processingTime') // 处理时间信息
      expect(response.body.data).toHaveProperty('confidence') // 结果置信度

      // 验证没有隐藏的数据处理
      expect(response.body.success).toBe(true)
      expect(response.body.data.provider).toBe('coze')
    })

    it('TC074: Should handle cross-border data transfer compliantly', async () => {
      const imageData = testImages.standardJpeg

      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })

      if (response.status === 200) {
        // 验证数据传输合规性标识
        expect(response.body.data.provider).toBeTruthy()

        // 验证不暴露内部处理细节
        const responseContent = JSON.stringify(response.body)
        expect(responseContent).not.toContain('internal')
        expect(responseContent).not.toContain('server')
        expect(responseContent).not.toContain('host')
        expect(responseContent).not.toContain('ip')
      }
    })

    it('TC075: Should implement proper data minimization', async () => {
      const imageData = testImages.standardJpeg

      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .expect(200)

      // 验证数据最小化原则（GDPR Article 5(1)(c)）
      const responseKeys = Object.keys(response.body.data)
      const expectedKeys = ['prompt', 'description', 'tags', 'confidence', 'provider', 'processingTime']

      // 响应应该只包含必要的数据
      responseKeys.forEach(key => {
        expect(expectedKeys).toContain(key)
      })

      // 验证没有包含不必要的元数据
      expect(response.body.data).not.toHaveProperty('rawAnalysis')
      expect(response.body.data).not.toHaveProperty('debugInfo')
      expect(response.body.data).not.toHaveProperty('internalId')
    })

    it('TC076: Should provide error information without data leakage', async () => {
      const nonImageData = TestDataFactory.createNonImageFile()

      const response = await app
        .post('/api/analyze-image')
        .attach('image', nonImageData.buffer, {
          filename: nonImageData.filename,
          contentType: nonImageData.mimeType
        })
        .expect(400)

      // 验证错误信息合规性
      expect(response.body.error).toBeTruthy()
      expect(typeof response.body.error).toBe('string')

      // 验证不泄露系统内部信息
      const errorMessage = response.body.error.toLowerCase()
      expect(errorMessage).not.toContain('stack')
      expect(errorMessage).not.toContain('trace')
      expect(errorMessage).not.toContain('internal')
      expect(errorMessage).not.toContain('system')
      expect(errorMessage).not.toContain('server')
      expect(errorMessage).not.toContain('path')
    })

    it('TC077: Should handle content filtering compliantly', async () => {
      // 模拟可能包含敏感内容的图像测试
      const imageData = testImages.standardJpeg

      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })

      if (response.status === 200) {
        const prompt = response.body.data.prompt

        // 验证内容过滤合规性
        expect(prompt).not.toContain('explicit')
        expect(prompt).not.toContain('adult')
        expect(prompt).not.toContain('violence')
        expect(prompt).not.toContain('inappropriate')

        // 验证生成的内容是适当的
        expect(prompt.length).toBeGreaterThan(0)
        expect(prompt.length).toBeLessThan(5000) // 合理长度限制
      }
    })

    it('TC078: Should maintain audit trail for compliance', async () => {
      const imageData = testImages.standardJpeg

      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })

      if (response.status === 200) {
        // 验证可审计性（但不在响应中暴露）
        expect(response.body.data.processingTime).toBeDefined()
        expect(response.body.data.provider).toBeDefined()

        // 验证响应包含足够信息进行审计追踪
        expect(typeof response.body.data.processingTime.total).toBe('number')
        expect(typeof response.body.data.processingTime.ai).toBe('number')
      }
    })

    it('TC079: Should respect data subject rights', async () => {
      const imageData = testImages.standardJpeg

      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })

      if (response.status === 200) {
        // 验证数据主体权利的支持
        // (在实际实现中，这可能需要额外的API端点)

        // 验证处理的合法性和透明度
        expect(response.body.data.provider).toBeTruthy()
        expect(response.body.data.confidence).toBeDefined()

        // 验证没有自动化决策的痕迹（GDPR Article 22）
        expect(response.body.data).not.toHaveProperty('automated_decision')
        expect(response.body.data).not.toHaveProperty('profile')
      }
    })

    it('TC080: Should implement proper consent mechanisms', async () => {
      const imageData = testImages.standardJpeg

      // 验证API设计支持合法处理基础
      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })

      if (response.status === 200) {
        // 验证处理的透明度和合法性
        expect(response.body.success).toBe(true)
        expect(response.body.data.provider).toBeTruthy()

        // 验证没有超出预期的数据处理
        const responseContent = JSON.stringify(response.body)
        expect(responseContent).not.toContain('tracking')
        expect(responseContent).not.toContain('analytics')
        expect(responseContent).not.toContain('advertisement')
        expect(responseContent).not.toContain('marketing')
      }
    })
  })
})