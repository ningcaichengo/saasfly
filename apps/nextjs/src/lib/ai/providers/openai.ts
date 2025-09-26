import {
  AIImageAnalyzer,
  AnalysisResult,
  ImageAnalysisOptions,
  AIServiceError,
  AI_ERROR_CODES
} from '../types';

export class OpenAIImageAnalyzer implements AIImageAnalyzer {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private timeout: number;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseUrl = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1';
    this.model = process.env.OPENAI_MODEL || 'gpt-4-vision-preview';
    this.timeout = 30000; // 30 seconds timeout
  }

  async analyzeImage(
    imageBuffer: Buffer,
    mimeType: string,
    options?: ImageAnalysisOptions
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    if (!this.apiKey) {
      throw new AIServiceError(
        'OpenAI API key not configured',
        AI_ERROR_CODES.INVALID_API_KEY,
        'openai'
      );
    }

    // Validate image first
    await this.validateImage(imageBuffer, mimeType);

    try {
      // Convert image to base64
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      // Build the prompt based on style
      const systemPrompt = this.buildSystemPrompt(options?.style);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Please analyze this image and generate a detailed prompt for AI art generation, along with a brief description and relevant tags.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: dataUrl
                  }
                }
              ]
            }
          ],
          max_tokens: options?.maxTokens || 500,
          temperature: options?.temperature || 0.7
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          throw new AIServiceError(
            'Invalid OpenAI API key',
            AI_ERROR_CODES.INVALID_API_KEY,
            'openai'
          );
        } else if (response.status === 429) {
          throw new AIServiceError(
            'OpenAI API quota exceeded',
            AI_ERROR_CODES.QUOTA_EXCEEDED,
            'openai'
          );
        } else {
          throw new AIServiceError(
            `OpenAI API error: ${response.status} ${response.statusText}`,
            AI_ERROR_CODES.SERVICE_UNAVAILABLE,
            'openai'
          );
        }
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new AIServiceError(
          'Invalid response format from OpenAI API',
          AI_ERROR_CODES.INVALID_RESPONSE,
          'openai'
        );
      }

      const content = data.choices[0].message.content;
      const parsed = this.parseResponse(content);

      const processingTime = Date.now() - startTime;

      return {
        ...parsed,
        confidence: 0.9, // OpenAI typically has high confidence
        processingTimeMs: processingTime
      };

    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          throw new AIServiceError(
            'OpenAI API request timeout',
            AI_ERROR_CODES.TIMEOUT,
            'openai',
            error
          );
        }

        throw new AIServiceError(
          `OpenAI API error: ${error.message}`,
          AI_ERROR_CODES.NETWORK_ERROR,
          'openai',
          error
        );
      }

      throw new AIServiceError(
        'Unknown error occurred',
        AI_ERROR_CODES.SERVICE_UNAVAILABLE,
        'openai'
      );
    }
  }

  private buildSystemPrompt(style?: string): string {
    const basePrompt = `You are an expert at analyzing images and creating detailed prompts for AI art generation.

Your task is to:
1. Analyze the provided image in detail
2. Generate a comprehensive prompt that would recreate or enhance this image
3. Provide a brief description of what you see
4. List relevant tags

Please respond in the following JSON format:
{
  "prompt": "detailed prompt for AI art generation",
  "description": "brief description of the image",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Focus on:
- Visual elements (colors, lighting, composition)
- Subject matter and objects
- Artistic style and technique
- Mood and atmosphere
- Technical details (if applicable)`;

    if (style === 'artistic') {
      return basePrompt + '\n\nEmphasize artistic and creative elements, focusing on style, mood, and creative interpretation.';
    } else if (style === 'technical') {
      return basePrompt + '\n\nEmphasize technical details, precision, and professional documentation aspects.';
    } else if (style === 'photographic') {
      return basePrompt + '\n\nEmphasize photographic qualities, lighting, composition, and camera techniques.';
    }

    return basePrompt;
  }

  private parseResponse(content: string): Omit<AnalysisResult, 'confidence' | 'processingTimeMs'> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        return {
          prompt: parsed.prompt || 'Generated AI art prompt',
          description: parsed.description || 'AI-generated image description',
          tags: Array.isArray(parsed.tags) ? parsed.tags : ['ai', 'generated']
        };
      }
    } catch (error) {
      // If JSON parsing fails, try to extract information manually
    }

    // Fallback: try to parse structured text
    const lines = content.split('\n').filter(line => line.trim());

    return {
      prompt: this.extractPrompt(content),
      description: this.extractDescription(content),
      tags: this.extractTags(content)
    };
  }

  private extractPrompt(content: string): string {
    // Look for prompt-like content (usually the longest meaningful sentence)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.length > 0 ? sentences[0].trim() : 'AI-generated artistic prompt based on image analysis';
  }

  private extractDescription(content: string): string {
    // Look for descriptive content
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10 && s.trim().length < 100);
    return sentences.length > 0 ? sentences[0].trim() : 'Professional image analysis result';
  }

  private extractTags(content: string): string[] {
    // Extract potential tags from content
    const words = content.toLowerCase().match(/\b\w{3,15}\b/g) || [];
    const commonTags = ['photography', 'art', 'design', 'creative', 'visual'];
    const extractedTags = words.filter(word =>
      word.length >= 3 &&
      !['the', 'and', 'for', 'with', 'this', 'that', 'from'].includes(word)
    ).slice(0, 3);

    return [...extractedTags, ...commonTags].slice(0, 5);
  }

  async validateImage(buffer: Buffer, mimeType: string): Promise<boolean> {
    // Check file size (OpenAI has a 20MB limit)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (buffer.length > maxSize) {
      throw new AIServiceError(
        `Image too large: ${Math.round(buffer.length / 1024 / 1024)}MB exceeds 20MB limit`,
        AI_ERROR_CODES.IMAGE_TOO_LARGE,
        'openai'
      );
    }

    // Check supported formats
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!supportedTypes.includes(mimeType)) {
      throw new AIServiceError(
        `Unsupported image format for OpenAI: ${mimeType}`,
        AI_ERROR_CODES.UNSUPPORTED_FORMAT,
        'openai'
      );
    }

    return true;
  }

  getProviderName(): string {
    return 'openai';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      // Test the API with a simple request
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(5000)
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}