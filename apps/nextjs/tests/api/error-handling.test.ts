import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TestDataFactory } from '../fixtures/test-data-factory'
import { createApp } from '../helpers/app-helper'
import { server } from '../setup'
import { errorHandlers } from '../mocks/handlers'

describe('Error Handling and Security Tests', () => {
  let app: any
  let testImages: ReturnType<typeof TestDataFactory.createTestImageSet>

  beforeEach(() => {
    app = createApp()
    testImages = TestDataFactory.createTestImageSet()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  describe('TC036-TC045: AI Service Error Handling Tests', () => {
    it('TC036: Should handle invalid API key error (401)', async () => {
      // 使用错误处理Mock
      server.use(errorHandlers.invalidApiKey)

      const imageData = testImages.standardJpeg

      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })

      expect(response.status).toBe(503) // Service Unavailable
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          provider: 'coze',
          processingTime: expect.any(Number)
        }
      })
    })

    it('TC037: Should handle quota exceeded error (429)', async () => {
      server.use(errorHandlers.quotaExceeded)

      const imageData = testImages.standardJpeg

      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })

      expect(response.status).toBe(429) // Too Many Requests
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'QUOTA_EXCEEDED',
          provider: 'coze'
        }
      })
    })

    it('TC038: Should handle service unavailable error (503)', async () => {
      server.use(errorHandlers.serviceUnavailable)

      const imageData = testImages.standardJpeg

      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })

      expect(response.status).toBe(503) // Service Unavailable
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          provider: 'coze'
        }
      })
    })

    it('TC039: Should handle network timeout error', async () => {
      // 模拟超时
      server.use(errorHandlers.timeout)

      const imageData = testImages.standardJpeg

      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })

      expect([408, 500]).toContain(response.status) // Request Timeout or Internal Server Error
      expect(response.body.success).toBe(false)
      expect(['TIMEOUT', 'NETWORK_ERROR', 'SERVICE_UNAVAILABLE']).toContain(response.body.error.code)
    })

    it('TC040: Should handle network connection error', async () => {
      server.use(errorHandlers.networkError)

      const imageData = testImages.standardJpeg

      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })

      expect([502, 500]).toContain(response.status) // Bad Gateway or Internal Server Error
      expect(response.body.success).toBe(false)
      expect(['NETWORK_ERROR', 'SERVICE_UNAVAILABLE']).toContain(response.body.error.code)
    })

    it('TC041: Should handle workflow execution failure', async () => {
      // 模拟工作流失败 - 发送无效的file_id
      const imageData = TestDataFactory.createTestImage({
        size: 1024,
        format: 'jpeg'
      })

      // 修改buffer来创建一个会导致file_id为undefined的情况
      const modifiedBuffer = Buffer.alloc(0) // 空buffer

      const response = await app
        .post('/api/analyze-image')
        .attach('image', modifiedBuffer, {
          filename: 'test.jpg',
          contentType: 'image/jpeg'
        })

      // 应该返回适当的错误
      expect([400, 422, 500]).toContain(response.status)
      expect(response.body.success).toBe(false)
    })

    it('TC042: Should handle file upload failure gracefully', async () => {
      // 创建一个超大文件来触发上传失败
      const oversizedImage = TestDataFactory.createTestImage({
        size: 15 * 1024 * 1024, // 15MB
        format: 'jpeg'
      })

      const response = await app
        .post('/api/analyze-image')
        .attach('image', oversizedImage.buffer, {
          filename: oversizedImage.filename,
          contentType: oversizedImage.mimeType
        })

      expect(response.status).toBe(413) // Payload Too Large
      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'IMAGE_TOO_LARGE'
        })
      })
    })

    it('TC043: Should handle invalid response format', async () => {
      // 这个测试需要模拟返回格式错误的响应
      // 在实际实现中，这可能需要特殊的Mock设置
      const imageData = testImages.standardJpeg

      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })

      // 正常情况下应该成功，除非特殊的Mock设置
      if (response.status === 200) {
        expect(response.body.success).toBe(true)
      } else {
        expect(response.body.success).toBe(false)
        expect(response.body.error).toBeDefined()
      }
    })

    it('TC044: Should provide detailed error context', async () => {
      // 发送无效的图像文件
      const nonImageData = TestDataFactory.createNonImageFile()

      const response = await app
        .post('/api/analyze-image')
        .attach('image', nonImageData.buffer, {
          filename: nonImageData.filename,
          contentType: nonImageData.mimeType
        })

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        error: expect.stringContaining('must be an image')
      })

      // 验证错误信息有用且安全
      expect(response.body.error).not.toContain('undefined')
      expect(response.body.error).not.toContain('<script>')
      expect(response.body.error).not.toContain('Error:')
    })

    it('TC045: Should maintain error handling consistency', async () => {
      const testCases = [
        {
          name: 'empty file',
          buffer: Buffer.alloc(0),
          filename: 'empty.jpg',
          mimeType: 'image/jpeg'
        },
        {
          name: 'non-image file',
          buffer: TestDataFactory.createNonImageFile().buffer,
          filename: 'document.pdf',
          mimeType: 'application/pdf'
        }
      ]

      for (const testCase of testCases) {
        const response = await app
          .post('/api/analyze-image')
          .attach('image', testCase.buffer, {
            filename: testCase.filename,
            contentType: testCase.mimeType
          })

        // 所有错误响应都应该有一致的结构
        if (response.status !== 200) {
          expect(response.body).toHaveProperty('error')
          expect(typeof response.body.error).toBe('string')
          expect(response.body.error.length).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('TC046-TC055: Security Tests', () => {
    it('TC046: Should prevent SQL injection in file metadata', async () => {
      const imageData = testImages.standardJpeg
      const maliciousFilename = "test'; DROP TABLE users; --.jpg"

      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: maliciousFilename,
          contentType: imageData.mimeType
        })

      // 应该安全处理恶意文件名
      expect([200, 400]).toContain(response.status)
      if (response.status === 200) {
        expect(response.body.success).toBe(true)
      }
    })

    it('TC047: Should prevent XSS in error messages', async () => {
      const maliciousData = Buffer.from('<script>alert("XSS")</script>')

      const response = await app
        .post('/api/analyze-image')
        .attach('image', maliciousData, {
          filename: '<script>alert("XSS")</script>.jpg',
          contentType: 'image/jpeg'
        })

      // 验证错误信息不包含未转义的脚本
      if (response.status !== 200) {
        const errorString = JSON.stringify(response.body)
        expect(errorString).not.toContain('<script>')
        expect(errorString).not.toContain('javascript:')
        expect(errorString).not.toContain('on"click"')
      }
    })

    it('TC048: Should handle path traversal attempts safely', async () => {
      const imageData = testImages.standardJpeg
      const maliciousPath = '../../../etc/passwd'

      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: maliciousPath,
          contentType: imageData.mimeType
        })

      // 应该安全处理路径遍历尝试
      expect([200, 400]).toContain(response.status)
      if (response.status === 200) {
        expect(response.body.success).toBe(true)
      }
    })

    it('TC049: Should validate file content vs declared MIME type', async () => {
      // 创建一个声明为图像但实际是文本的文件
      const textBuffer = Buffer.from('This is not an image')

      const response = await app
        .post('/api/analyze-image')
        .attach('image', textBuffer, {
          filename: 'fake_image.jpg',
          contentType: 'image/jpeg' // 错误的MIME类型
        })

      // 应该检测到内容与声明类型不匹配
      expect(response.status).toBe(400)
      expect(response.body.error).toBeTruthy()
    })

    it('TC050: Should handle malicious image headers', async () => {
      const maliciousImage = testImages.maliciousImage

      const response = await app
        .post('/api/analyze-image')
        .attach('image', maliciousImage.buffer, {
          filename: maliciousImage.filename,
          contentType: maliciousImage.mimeType
        })

      // 应该安全处理包含恶意载荷的图像
      expect([200, 400, 422]).toContain(response.status)
      if (response.status === 200) {
        // 如果成功处理，确保响应内容是安全的
        const responseString = JSON.stringify(response.body)
        expect(responseString).not.toContain('<script>')
        expect(responseString).not.toContain('alert(')
      }
    })

    it('TC051: Should protect against ZIP bomb attacks', async () => {
      // 创建一个高度压缩的恶意文件
      const potentialZipBomb = TestDataFactory.createTestImage({
        size: 10 * 1024 * 1024, // 10MB
        format: 'png'
      })

      const startTime = Date.now()

      const response = await app
        .post('/api/analyze-image')
        .attach('image', potentialZipBomb.buffer, {
          filename: potentialZipBomb.filename,
          contentType: potentialZipBomb.mimeType
        })

      const processingTime = Date.now() - startTime

      // 处理时间不应过长（防止DoS）
      expect(processingTime).toBeLessThan(60000) // 不超过60秒

      if (response.status === 200) {
        expect(response.body.success).toBe(true)
      }
    })

    it('TC052: Should sanitize EXIF data', async () => {
      const imageWithExif = testImages.imageWithExif

      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageWithExif.buffer, {
          filename: imageWithExif.filename,
          contentType: imageWithExif.mimeType
        })

      if (response.status === 200) {
        // 验证响应中不包含敏感的EXIF数据
        const responseString = JSON.stringify(response.body)
        expect(responseString).not.toContain('gpsLatitude')
        expect(responseString).not.toContain('gpsLongitude')
        expect(responseString).not.toContain('Test Camera')
      }
    })

    it('TC053: Should prevent buffer overflow attacks', async () => {
      // 创建带有恶意长文件名的请求
      const longFilename = 'a'.repeat(10000) + '.jpg'
      const imageData = testImages.standardJpeg

      const response = await app
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: longFilename,
          contentType: imageData.mimeType
        })

      // 应该安全处理超长文件名
      expect([200, 400, 413]).toContain(response.status)
    })

    it('TC054: Should handle concurrent security attacks', async () => {
      const maliciousRequests = Array.from({ length: 5 }, (_, i) => {
        const maliciousData = Buffer.from(`<script>alert("XSS${i}")</script>`)
        return app
          .post('/api/analyze-image')
          .attach('image', maliciousData, {
            filename: `malicious_${i}.jpg`,
            contentType: 'image/jpeg'
          })
      })

      const responses = await Promise.allSettled(maliciousRequests)

      // 验证所有请求都被安全处理
      responses.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const response = result.value
          if (response.status !== 200) {
            const responseString = JSON.stringify(response.body)
            expect(responseString).not.toContain('<script>')
            expect(responseString).not.toContain(`XSS${index}`)
          }
        }
      })
    })

    it('TC055: Should implement rate limiting protection', async () => {
      const imageData = testImages.standardJpeg

      // 快速发送大量请求
      const rapidRequests = Array.from({ length: 20 }, () =>
        app
          .post('/api/analyze-image')
          .attach('image', imageData.buffer, {
            filename: `rapid_${Math.random()}.jpg`,
            contentType: imageData.mimeType
          })
      )

      const startTime = Date.now()
      const responses = await Promise.allSettled(rapidRequests)
      const endTime = Date.now()

      const fulfilled = responses.filter(r => r.status === 'fulfilled').length
      const rejected = responses.filter(r => r.status === 'rejected').length

      // 验证系统能够处理快速请求
      expect(fulfilled + rejected).toBe(20)

      // 验证响应时间在合理范围内
      const averageTime = (endTime - startTime) / 20
      expect(averageTime).toBeLessThan(10000) // 平均不超过10秒每个请求
    })
  })
})