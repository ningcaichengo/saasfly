import { AIImageAnalyzer, AIServiceConfig, AIServiceError, AI_ERROR_CODES } from './types';
import { MockImageAnalyzer } from './providers/mock';
import { OpenAIImageAnalyzer } from './providers/openai';

export class AIServiceFactory {
  private static instance: AIServiceFactory;
  private analyzers: Map<string, AIImageAnalyzer> = new Map();

  private constructor() {}

  static getInstance(): AIServiceFactory {
    if (!AIServiceFactory.instance) {
      AIServiceFactory.instance = new AIServiceFactory();
    }
    return AIServiceFactory.instance;
  }

  async createAnalyzer(config?: AIServiceConfig): Promise<AIImageAnalyzer> {
    const provider = config?.provider || (process.env.AI_SERVICE_PROVIDER as any) || 'mock';

    // Return cached analyzer if available
    if (this.analyzers.has(provider)) {
      const analyzer = this.analyzers.get(provider)!;
      const isAvailable = await analyzer.isAvailable();
      if (isAvailable) {
        return analyzer;
      }
      // Remove unavailable analyzer from cache
      this.analyzers.delete(provider);
    }

    let analyzer: AIImageAnalyzer;

    switch (provider) {
      case 'openai':
        analyzer = new OpenAIImageAnalyzer();
        break;

      case 'mock':
      default:
        analyzer = new MockImageAnalyzer();
        break;
    }

    // Verify the analyzer is available before caching
    const isAvailable = await analyzer.isAvailable();
    if (!isAvailable) {
      throw new AIServiceError(
        `AI service provider '${provider}' is not available`,
        AI_ERROR_CODES.SERVICE_UNAVAILABLE,
        provider
      );
    }

    // Cache the analyzer
    this.analyzers.set(provider, analyzer);

    return analyzer;
  }

  async getAvailableProviders(): Promise<string[]> {
    const providers = ['mock', 'openai'];
    const availableProviders: string[] = [];

    for (const provider of providers) {
      try {
        const analyzer = await this.createAnalyzer({ provider: provider as any });
        const isAvailable = await analyzer.isAvailable();
        if (isAvailable) {
          availableProviders.push(provider);
        }
      } catch {
        // Provider is not available
      }
    }

    return availableProviders;
  }

  async getPreferredAnalyzer(): Promise<AIImageAnalyzer> {
    const preferredProvider = process.env.AI_SERVICE_PROVIDER || 'mock';

    try {
      return await this.createAnalyzer({ provider: preferredProvider as any });
    } catch (error) {
      console.warn(`Preferred AI provider '${preferredProvider}' is not available, falling back to mock`);

      // Fallback to mock if preferred provider is not available
      return await this.createAnalyzer({ provider: 'mock' });
    }
  }

  clearCache(): void {
    this.analyzers.clear();
  }
}

// Convenience function for getting the default analyzer
export async function getImageAnalyzer(config?: AIServiceConfig): Promise<AIImageAnalyzer> {
  const factory = AIServiceFactory.getInstance();

  if (config) {
    return await factory.createAnalyzer(config);
  }

  return await factory.getPreferredAnalyzer();
}