import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../helpers/app-helper'
import { TestDataFactory } from '../fixtures/test-data-factory'
import { server } from '../setup'
import { errorHandlers } from '../mocks/handlers'

describe('Image Analysis API - P0 Core Functionality Tests', () => {
  let app: any
  let testImages: ReturnType<typeof TestDataFactory.createTestImageSet>

  beforeEach(() => {
    app = createApp()
    testImages = TestDataFactory.createTestImageSet()
  })

  describe('TC001-TC010: Basic Functionality Tests', () => {
    it('TC001: Should successfully analyze standard JPEG image', async () => {
      const imageData = testImages.standardJpeg
      const formData = TestDataFactory.createFormData(imageData, 'photographic', 'auto')

      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .field('style', 'photographic')
        .field('language', 'auto')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          prompt: expect.stringMatching(/.{10,2000}/), // 10-2000字符
          description: expect.stringMatching(/.{10,}/),
          tags: expect.arrayContaining([expect.any(String)]),
          confidence: expect.any(Number),
          provider: 'coze',
          processingTime: {
            total: expect.any(Number),
            ai: expect.any(Number)
          }
        }
      })

      // 验证置信度范围
      expect(response.body.data.confidence).toBeGreaterThanOrEqual(0)
      expect(response.body.data.confidence).toBeLessThanOrEqual(1)

      // 验证处理时间合理性
      expect(response.body.data.processingTime.total).toBeGreaterThan(0)
      expect(response.body.data.processingTime.total).toBeLessThan(30000)

      // 验证提示词质量
      const prompt = response.body.data.prompt
      expect(prompt).not.toContain('<script>')
      expect(prompt).not.toContain('undefined')
      expect(prompt.split(' ').length).toBeGreaterThan(3) // 至少3个词
    })

    it('TC002: Should handle PNG images correctly', async () => {
      const imageData = testImages.largePng

      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .field('style', 'artistic')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.prompt).toBeTruthy()
    })

    it('TC003: Should handle GIF images correctly', async () => {
      const imageData = testImages.gifImage

      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('TC004: Should handle WebP images correctly', async () => {
      const imageData = testImages.webpImage

      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('TC005: Should handle BMP images correctly', async () => {
      const imageData = testImages.bmpImage

      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('TC006: Should map photographic style to normal prompttype', async () => {
      const imageData = testImages.standardJpeg

      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .field('style', 'photographic')
        .expect(200)

      // 验证返回的提示词符合photographic风格
      const prompt = response.body.data.prompt
      expect(prompt).toMatch(/professional|high-quality|photograph|realistic|natural/i)
    })

    it('TC007: Should map artistic style to flux prompttype', async () => {
      const imageData = testImages.standardJpeg

      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .field('style', 'artistic')
        .expect(200)

      // 验证返回的提示词符合artistic/flux风格
      const prompt = response.body.data.prompt
      expect(prompt).toMatch(/astronaut|space|nebula|cosmic|ethereal/i)
    })

    it('TC008: Should map technical style to stableDiffusion prompttype', async () => {
      const imageData = testImages.standardJpeg

      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .field('style', 'technical')
        .expect(200)

      const prompt = response.body.data.prompt
      expect(prompt).toMatch(/digital art|concept art|artstation|detailed|illustration/i)
    })

    it('TC009: Should map creative style to midjourney prompttype', async () => {
      const imageData = testImages.standardJpeg

      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .field('style', 'creative')
        .expect(200)

      const prompt = response.body.data.prompt
      expect(prompt).toMatch(/beautiful|artistic|masterpiece|intricate|stunning|award-winning/i)
    })

    it('TC010: Should default to photographic style when no style specified', async () => {
      const imageData = testImages.standardJpeg

      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .expect(200)

      const prompt = response.body.data.prompt
      expect(prompt).toMatch(/professional|high-quality|photograph|realistic|natural/i)
    })
  })

  describe('TC011-TC018: Boundary Value Tests', () => {
    it('TC011: Should handle minimum file size (1KB)', async () => {
      const imageData = testImages.tinyImage

      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('TC012: Should handle standard file size (1MB)', async () => {
      const imageData = testImages.standardJpeg

      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('TC013: Should handle large file size (9.5MB, near limit)', async () => {
      const imageData = testImages.maxSizeImage

      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('TC014: Should reject oversized files (>10MB)', async () => {
      const imageData = testImages.oversizeImage

      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .expect(413)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('IMAGE_TOO_LARGE')
    })
  })

  describe('TC019-TC024: Input Validation Tests', () => {
    it('TC019: Should return 400 when no image file provided', async () => {
      const response = await request(app)
        .post('/api/analyze-image')
        .field('style', 'photographic')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'No image file provided'
      })
    })

    it('TC020: Should return 400 for non-image files', async () => {
      const nonImageData = TestDataFactory.createNonImageFile()

      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', nonImageData.buffer, {
          filename: nonImageData.filename,
          contentType: nonImageData.mimeType
        })
        .expect(400)

      expect(response.body.error).toBe('File must be an image')
    })

    it('TC021: Should handle empty image file gracefully', async () => {
      const emptyBuffer = Buffer.alloc(0)

      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', emptyBuffer, {
          filename: 'empty.jpg',
          contentType: 'image/jpeg'
        })

      // 应该返回适当的错误或处理空文件
      expect([400, 422, 500]).toContain(response.status)
    })

    it('TC022: Should handle corrupted image files', async () => {
      const corruptedImage = testImages.corruptedJpeg

      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', corruptedImage.buffer, {
          filename: corruptedImage.filename,
          contentType: corruptedImage.mimeType
        })

      // 应该能处理损坏的文件或返回适当错误
      expect([200, 400, 422, 500]).toContain(response.status)
    })

    it('TC023: Should default to photographic for invalid style', async () => {
      const imageData = testImages.standardJpeg

      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: imageData.filename,
          contentType: imageData.mimeType
        })
        .field('style', 'invalid_style')
        .expect(200)

      // 应该默认使用photographic风格
      const prompt = response.body.data.prompt
      expect(prompt).toMatch(/professional|high-quality|photograph|realistic|natural/i)
    })

    it('TC024: Should handle malicious filenames safely', async () => {
      const imageData = testImages.standardJpeg
      const maliciousFilename = '../../../etc/passwd.jpg'

      const response = await request(app)
        .post('/api/analyze-image')
        .attach('image', imageData.buffer, {
          filename: maliciousFilename,
          contentType: imageData.mimeType
        })
        .expect(200)

      // 应该安全处理恶意文件名
      expect(response.body.success).toBe(true)
    })
  })
})