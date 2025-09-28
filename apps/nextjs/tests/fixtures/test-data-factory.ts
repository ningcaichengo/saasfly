import { createHash } from 'crypto'

export interface TestImageOptions {
  size: number
  format: 'jpeg' | 'png' | 'gif' | 'webp' | 'bmp'
  width?: number
  height?: number
  corrupted?: boolean
  malicious?: boolean
  withExif?: boolean
  withMetadata?: boolean
}

export interface TestImageData {
  buffer: Buffer
  mimeType: string
  filename: string
  size: number
  checksum: string
  metadata?: Record<string, any>
}

export class TestDataFactory {
  // 图像文件头定义
  private static readonly IMAGE_HEADERS = {
    jpeg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    gif: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
    webp: [0x52, 0x49, 0x46, 0x46], // RIFF header
    bmp: [0x42, 0x4D] // BM
  }

  // MIME类型映射
  private static readonly MIME_TYPES = {
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp'
  }

  /**
   * 创建标准测试图像
   */
  static createTestImage(options: TestImageOptions): TestImageData {
    const { size, format, corrupted = false, malicious = false, withExif = false } = options

    let buffer: Buffer

    if (corrupted) {
      buffer = this.createCorruptedImage(size, format)
    } else if (malicious) {
      buffer = this.createMaliciousImage(size, format)
    } else {
      buffer = this.createValidImage(size, format, withExif)
    }

    const checksum = createHash('md5').update(buffer).digest('hex')
    const filename = `test_${format}_${size}_${checksum.substring(0, 8)}.${format}`

    return {
      buffer,
      mimeType: this.MIME_TYPES[format],
      filename,
      size: buffer.length,
      checksum,
      metadata: withExif ? this.generateExifMetadata() : undefined
    }
  }

  /**
   * 创建有效的测试图像
   */
  private static createValidImage(size: number, format: keyof typeof TestDataFactory.IMAGE_HEADERS, withExif: boolean): Buffer {
    const header = Buffer.from(this.IMAGE_HEADERS[format])
    let content = Buffer.alloc(Math.max(0, size - header.length))

    // 填充一些模拟的图像数据
    for (let i = 0; i < content.length; i++) {
      content[i] = Math.floor(Math.random() * 256)
    }

    if (withExif && format === 'jpeg') {
      const exifData = this.createExifData()
      content = Buffer.concat([exifData, content.slice(exifData.length)])
    }

    return Buffer.concat([header, content])
  }

  /**
   * 创建损坏的测试图像
   */
  private static createCorruptedImage(size: number, format: keyof typeof TestDataFactory.IMAGE_HEADERS): Buffer {
    const header = Buffer.from(this.IMAGE_HEADERS[format])
    // 故意损坏文件头
    header[header.length - 1] = 0x00

    const content = Buffer.alloc(Math.max(0, size - header.length))
    return Buffer.concat([header, content])
  }

  /**
   * 创建包含恶意载荷的测试图像
   */
  private static createMaliciousImage(size: number, format: keyof typeof TestDataFactory.IMAGE_HEADERS): Buffer {
    const header = Buffer.from(this.IMAGE_HEADERS[format])
    const maliciousPayload = Buffer.from('<script>alert("XSS")</script>')
    const padding = Buffer.alloc(Math.max(0, size - header.length - maliciousPayload.length))

    return Buffer.concat([header, maliciousPayload, padding])
  }

  /**
   * 创建EXIF元数据
   */
  private static createExifData(): Buffer {
    // 简化的EXIF数据结构
    const exifMarker = Buffer.from([0xFF, 0xE1]) // APP1 marker
    const exifSize = Buffer.from([0x00, 0x16]) // EXIF data size
    const exifIdentifier = Buffer.from('Exif\0\0') // EXIF identifier
    const mockExifData = Buffer.alloc(10, 0x41) // 填充A字符作为模拟数据

    return Buffer.concat([exifMarker, exifSize, exifIdentifier, mockExifData])
  }

  /**
   * 生成模拟的图像元数据
   */
  private static generateExifMetadata() {
    return {
      cameraMake: 'Test Camera',
      cameraModel: 'Test Model X',
      dateTime: new Date().toISOString(),
      gpsLatitude: '40.7128',
      gpsLongitude: '-74.0060',
      orientation: 1,
      xResolution: 72,
      yResolution: 72
    }
  }

  /**
   * 创建预定义的测试图像集合
   */
  static createTestImageSet(): Record<string, TestImageData> {
    return {
      // 基础功能测试图像
      smallJpeg: this.createTestImage({ size: 1024, format: 'jpeg' }),
      standardJpeg: this.createTestImage({ size: 1024 * 1024, format: 'jpeg' }),
      largePng: this.createTestImage({ size: 5 * 1024 * 1024, format: 'png' }),

      // 边界测试图像
      tinyImage: this.createTestImage({ size: 100, format: 'png' }),
      maxSizeImage: this.createTestImage({ size: 9.5 * 1024 * 1024, format: 'jpeg' }),
      oversizeImage: this.createTestImage({ size: 11 * 1024 * 1024, format: 'png' }),

      // 格式测试图像
      gifImage: this.createTestImage({ size: 2 * 1024 * 1024, format: 'gif' }),
      webpImage: this.createTestImage({ size: 1.5 * 1024 * 1024, format: 'webp' }),
      bmpImage: this.createTestImage({ size: 3 * 1024 * 1024, format: 'bmp' }),

      // 安全测试图像
      corruptedJpeg: this.createTestImage({
        size: 1024 * 1024,
        format: 'jpeg',
        corrupted: true
      }),
      maliciousImage: this.createTestImage({
        size: 1024 * 1024,
        format: 'png',
        malicious: true
      }),

      // 隐私测试图像
      imageWithExif: this.createTestImage({
        size: 2 * 1024 * 1024,
        format: 'jpeg',
        withExif: true
      }),

      // 性能测试图像
      performanceTestSmall: this.createTestImage({ size: 500 * 1024, format: 'jpeg' }),
      performanceTestMedium: this.createTestImage({ size: 2 * 1024 * 1024, format: 'png' }),
      performanceTestLarge: this.createTestImage({ size: 8 * 1024 * 1024, format: 'jpeg' })
    }
  }

  /**
   * 创建无效文件（非图像）
   */
  static createNonImageFile(size: number = 1024): TestImageData {
    const buffer = Buffer.from('This is not an image file. It\'s a text file pretending to be an image.')
    const padding = Buffer.alloc(Math.max(0, size - buffer.length))
    const finalBuffer = Buffer.concat([buffer, padding])

    return {
      buffer: finalBuffer,
      mimeType: 'text/plain',
      filename: 'fake_image.txt',
      size: finalBuffer.length,
      checksum: createHash('md5').update(finalBuffer).digest('hex')
    }
  }

  /**
   * 创建FormData对象用于API测试
   */
  static createFormData(imageData: TestImageData, style?: string, language?: string): FormData {
    const formData = new FormData()

    const blob = new Blob([imageData.buffer], { type: imageData.mimeType })
    formData.append('image', blob, imageData.filename)

    if (style) formData.append('style', style)
    if (language) formData.append('language', language)

    return formData
  }
}