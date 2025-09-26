import { NextRequest, NextResponse } from 'next/server';
import { getImageAnalyzer } from '~/lib/ai/factory';
import { AIServiceError, ImageAnalysisOptions } from '~/lib/ai/types';
import { logger, analytics } from '~/lib/monitoring/logger';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request data
    const formData = await req.formData();
    const file = formData.get('image') as File;
    const style = formData.get('style') as string || 'creative';
    const language = formData.get('language') as string || 'auto';

    logger.info('Image analysis request received', 'API', {
      fileSize: file?.size,
      fileType: file?.type,
      style,
      language
    });

    if (!file) {
      logger.warn('Image analysis failed: No file provided', 'API');
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type;

    // Validate basic file properties
    if (!mimeType.startsWith('image/')) {
      logger.warn('Image analysis failed: Invalid file type', 'API', {
        mimeType,
        fileName: file.name
      });
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Track analysis started
    analytics.trackImageAnalysisStarted(file.size, mimeType);

    // Get AI analyzer (will use configured provider)
    const analyzer = await getImageAnalyzer();

    // Set analysis options
    const options: ImageAnalysisOptions = {
      style: style as any,
      language: language as any,
      maxTokens: 500,
      temperature: 0.7
    };

    logger.info(`Starting AI analysis with provider: ${analyzer.getProviderName()}`, 'API');

    // Perform analysis
    const result = await analyzer.analyzeImage(buffer, mimeType, options);

    const totalTime = Date.now() - startTime;

    logger.info(`AI analysis completed successfully in ${totalTime}ms`, 'API', {
      provider: analyzer.getProviderName(),
      confidence: result.confidence,
      promptLength: result.prompt?.length,
      tagsCount: result.tags?.length
    });

    // Track successful analysis
    analytics.trackImageAnalysisCompleted(
      analyzer.getProviderName(),
      totalTime,
      true
    );

    return NextResponse.json({
      success: true,
      data: {
        prompt: result.prompt,
        description: result.description,
        tags: result.tags,
        confidence: result.confidence,
        provider: analyzer.getProviderName(),
        processingTime: {
          total: totalTime,
          ai: result.processingTimeMs
        }
      }
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;

    logger.error('AI analysis failed', 'API', {
      error: error instanceof Error ? error.message : String(error),
      processingTime: totalTime,
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof AIServiceError) {
      // Handle specific AI service errors
      const statusCode = getStatusCodeForError(error.code);

      // Track failed analysis with specific error
      analytics.trackImageAnalysisCompleted(
        error.provider || 'unknown',
        totalTime,
        false,
        error.code
      );

      logger.warn(`AI service error: ${error.code}`, 'API', {
        provider: error.provider,
        message: error.message
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
            provider: error.provider,
            processingTime: totalTime
          }
        },
        { status: statusCode }
      );
    }

    // Handle unexpected errors
    analytics.trackImageAnalysisCompleted(
      'unknown',
      totalTime,
      false,
      'INTERNAL_ERROR'
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Internal server error occurred during image analysis',
          code: 'INTERNAL_ERROR',
          processingTime: totalTime
        }
      },
      { status: 500 }
    );
  }
}

function getStatusCodeForError(errorCode: string): number {
  switch (errorCode) {
    case 'INVALID_API_KEY':
      return 503; // Service Unavailable
    case 'QUOTA_EXCEEDED':
      return 429; // Too Many Requests
    case 'IMAGE_TOO_LARGE':
      return 413; // Payload Too Large
    case 'UNSUPPORTED_FORMAT':
      return 415; // Unsupported Media Type
    case 'TIMEOUT':
      return 408; // Request Timeout
    case 'SERVICE_UNAVAILABLE':
      return 503; // Service Unavailable
    case 'NETWORK_ERROR':
      return 502; // Bad Gateway
    case 'INVALID_RESPONSE':
      return 502; // Bad Gateway
    default:
      return 500; // Internal Server Error
  }
}