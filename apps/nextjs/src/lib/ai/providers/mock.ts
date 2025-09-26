import {
  AIImageAnalyzer,
  AnalysisResult,
  ImageAnalysisOptions,
  AIServiceError,
  AI_ERROR_CODES
} from '../types';

export class MockImageAnalyzer implements AIImageAnalyzer {
  private mockPrompts = [
    {
      prompt: "A stunning photograph of a serene landscape, golden hour lighting, ultra-detailed, cinematic composition, professional photography",
      description: "A beautifully composed image with excellent lighting and composition",
      tags: ["photography", "landscape", "golden hour", "cinematic"]
    },
    {
      prompt: "Beautiful portrait photography, soft natural lighting, bokeh background, high resolution, professional studio lighting",
      description: "Professional quality photograph with great attention to detail",
      tags: ["portrait", "lighting", "bokeh", "professional"]
    },
    {
      prompt: "Vibrant urban architecture, modern cityscape, symmetrical composition, sharp details, architectural photography",
      description: "Visually striking image with strong architectural elements",
      tags: ["architecture", "urban", "modern", "symmetrical"]
    },
    {
      prompt: "Colorful abstract art, dynamic composition, bold colors, creative design, digital art masterpiece",
      description: "Creative and artistic composition with vibrant colors",
      tags: ["abstract", "colorful", "creative", "artistic"]
    },
    {
      prompt: "Nature macro photography, incredible detail, shallow depth of field, natural colors, stunning clarity",
      description: "High-quality image with distinctive visual characteristics",
      tags: ["nature", "macro", "detailed", "organic"]
    },
    {
      prompt: "A sun, Space Opera scene. Vast starfield with colorful nebulae. Massive ornate spacecraft. Alien planet with multiple moons. Dramatic space lighting. Advanced tech elements. Diverse alien species. Epic scale. Vibrant cosmic colors. Sleek futuristic designs",
      description: "Epic space opera scene with cosmic grandeur and futuristic elements",
      tags: ["space", "sci-fi", "cosmic", "futuristic", "epic"]
    }
  ];

  async analyzeImage(
    imageBuffer: Buffer,
    mimeType: string,
    options?: ImageAnalysisOptions
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    // Validate image first
    await this.validateImage(imageBuffer, mimeType);

    // Simulate processing delay (1-3 seconds)
    const delay = Math.random() * 2000 + 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Randomly select a mock response
    const randomIndex = Math.floor(Math.random() * this.mockPrompts.length);
    const mockResult = this.mockPrompts[randomIndex];

    // Add some randomization based on style
    let finalPrompt = mockResult.prompt;
    if (options?.style === 'artistic') {
      finalPrompt += ", artistic interpretation, creative vision, expressive style";
    } else if (options?.style === 'technical') {
      finalPrompt += ", technical precision, detailed analysis, professional documentation";
    } else if (options?.style === 'photographic') {
      finalPrompt += ", photorealistic quality, camera settings optimized, professional technique";
    }

    const processingTime = Date.now() - startTime;

    return {
      prompt: finalPrompt,
      description: mockResult.description,
      tags: [...mockResult.tags],
      confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
      processingTimeMs: processingTime
    };
  }

  async validateImage(buffer: Buffer, mimeType: string): Promise<boolean> {
    // Check file size (simulate 10MB limit)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024;
    if (buffer.length > maxSize) {
      throw new AIServiceError(
        `Image too large: ${Math.round(buffer.length / 1024 / 1024)}MB exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`,
        AI_ERROR_CODES.IMAGE_TOO_LARGE,
        'mock'
      );
    }

    // Check supported formats
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,webp')
      .split(',')
      .map(type => `image/${type.trim()}`)
      .concat(['image/jpg', 'image/jpeg'].includes(mimeType) ? ['image/jpeg', 'image/jpg'] : []);

    if (!allowedTypes.includes(mimeType)) {
      throw new AIServiceError(
        `Unsupported image format: ${mimeType}`,
        AI_ERROR_CODES.UNSUPPORTED_FORMAT,
        'mock'
      );
    }

    // Simulate 5% random validation failure for testing
    if (Math.random() < 0.05) {
      throw new AIServiceError(
        'Image validation failed - corrupted or invalid image data',
        AI_ERROR_CODES.INVALID_RESPONSE,
        'mock'
      );
    }

    return true;
  }

  getProviderName(): string {
    return 'mock';
  }

  async isAvailable(): Promise<boolean> {
    // Mock service is always available
    return true;
  }
}