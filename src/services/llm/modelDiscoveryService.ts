import { SecureLLMService } from './secureLLMService';

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  contextWindow?: number;
  maxTokens?: number;
  supportsVision?: boolean;
  pricing?: {
    input: number;
    output: number;
  };
}

export interface ProviderModels {
  provider: 'openai' | 'anthropic' | 'google';
  models: ModelInfo[];
  error?: string;
}

/**
 * Service de découverte de modèles via le service sécurisé
 * MIGRATION: Utilise maintenant SecureLLMService au lieu d'appels directs
 */
class ModelDiscoveryService {
  
  /**
   * Teste une clé API de manière sécurisée
   */
  async testApiKey(provider: 'openai' | 'anthropic' | 'google', apiKey: string): Promise<boolean> {
    try {
      console.log('🧪 Testing API key via secure service for:', provider);
      
      const result = await SecureLLMService.testAPIKey(provider, apiKey);
      return result.isValid;
    } catch (error) {
      console.error('Error testing API key:', error);
      return false;
    }
  }

  /**
   * Découvre les modèles disponibles via la clé API de l'utilisateur
   */
  async discoverAvailableModels(provider: 'openai' | 'anthropic' | 'google'): Promise<ProviderModels> {
    console.log(`🔍 Découverte des modèles pour ${provider}...`);
    
    try {
      // Vérifier si l'utilisateur a une clé API
      const hasKey = await SecureLLMService.hasValidAPIKey(provider);
      if (!hasKey) {
        return {
          provider,
          models: [],
          error: `Aucune clé API configurée pour ${provider}`
        };
      }

      // Pour maintenant, retourner les modèles par défaut
      // TODO: Implémenter la découverte automatique via Edge Function
      const defaultModels = this.getDefaultModels(provider);
      
      console.log(`✅ Modèles par défaut pour ${provider}:`, defaultModels);
      
      return {
        provider,
        models: defaultModels,
        error: undefined
      };
    } catch (error) {
      console.error(`❌ Erreur lors de la découverte des modèles pour ${provider}:`, error);
      return {
        provider,
        models: [],
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Retourne les modèles par défaut pour chaque provider
   */
  private getDefaultModels(provider: 'openai' | 'anthropic' | 'google'): ModelInfo[] {
    const modelMap: Record<string, ModelInfo[]> = {
      openai: [
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          description: 'Most capable GPT-4 model',
          contextWindow: 128000,
          maxTokens: 4096,
          supportsVision: true,
          pricing: { input: 0.005, output: 0.015 }
        },
        {
          id: 'gpt-4o-mini',
          name: 'GPT-4o Mini',
          description: 'Faster, cheaper GPT-4o',
          contextWindow: 128000,
          maxTokens: 16384,
          supportsVision: true,
          pricing: { input: 0.00015, output: 0.0006 }
        },
        {
          id: 'gpt-4-turbo',
          name: 'GPT-4 Turbo',
          description: 'Latest GPT-4 Turbo model',
          contextWindow: 128000,
          maxTokens: 4096,
          supportsVision: true,
          pricing: { input: 0.01, output: 0.03 }
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          description: 'Fast and efficient model',
          contextWindow: 16385,
          maxTokens: 4096,
          supportsVision: false,
          pricing: { input: 0.001, output: 0.002 }
        }
      ],
      anthropic: [
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet',
          description: 'Most intelligent Claude model',
          contextWindow: 200000,
          maxTokens: 8192,
          supportsVision: true,
          pricing: { input: 0.003, output: 0.015 }
        },
        {
          id: 'claude-3-opus-20240229',
          name: 'Claude 3 Opus',
          description: 'Most powerful Claude 3 model',
          contextWindow: 200000,
          maxTokens: 8192,
          supportsVision: true,
          pricing: { input: 0.015, output: 0.075 }
        },
        {
          id: 'claude-3-sonnet-20240229',
          name: 'Claude 3 Sonnet',
          description: 'Balanced performance and speed',
          contextWindow: 200000,
          maxTokens: 8192,
          supportsVision: true,
          pricing: { input: 0.003, output: 0.015 }
        },
        {
          id: 'claude-3-haiku-20240307',
          name: 'Claude 3 Haiku',
          description: 'Fastest Claude 3 model',
          contextWindow: 200000,
          maxTokens: 8192,
          supportsVision: true,
          pricing: { input: 0.00025, output: 0.00125 }
        }
      ],
      google: [
        {
          id: 'gemini-1.5-pro',
          name: 'Gemini 1.5 Pro',
          description: 'Most capable Gemini model',
          contextWindow: 2000000,
          maxTokens: 8192,
          supportsVision: true,
          pricing: { input: 0.00125, output: 0.005 }
        },
        {
          id: 'gemini-1.5-flash',
          name: 'Gemini 1.5 Flash',
          description: 'Fast and efficient Gemini model',
          contextWindow: 1000000,
          maxTokens: 8192,
          supportsVision: true,
          pricing: { input: 0.000075, output: 0.0003 }
        },
        {
          id: 'gemini-pro',
          name: 'Gemini Pro',
          description: 'Standard Gemini model',
          contextWindow: 32768,
          maxTokens: 8192,
          supportsVision: false,
          pricing: { input: 0.0005, output: 0.0015 }
        }
      ]
    };

    return modelMap[provider] || [];
  }
}

export const modelDiscoveryService = new ModelDiscoveryService();