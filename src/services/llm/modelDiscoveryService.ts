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

      // Découverte dynamique via Edge Function uniquement
      const dynamicModels = await this.discoverModelsViaAPI(provider);
      
      if (dynamicModels.length > 0) {
        console.log(`✅ ${dynamicModels.length} modèles découverts dynamiquement pour ${provider}`);
        return {
          provider,
          models: dynamicModels,
          error: undefined
        };
      }

      // Aucun modèle trouvé dynamiquement
      return {
        provider,
        models: [],
        error: `Aucun modèle disponible avec votre clé API ${provider}`
      };
    } catch (error) {
      console.error(`❌ Erreur lors de la découverte des modèles pour ${provider}:`, error);
      
      // En cas d'erreur, ne pas afficher de modèles par défaut
      return {
        provider,
        models: [],
        error: `Erreur lors de la récupération des modèles via votre clé API: ${error.message}`
      };
    }
  }

  /**
   * Découvre les modèles via l'Edge Function
   */
  private async discoverModelsViaAPI(provider: 'openai' | 'anthropic' | 'google'): Promise<ModelInfo[]> {
    try {
      // Importer supabase pour l'authentication
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Obtenir le token d'authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Utilisateur non authentifié');
      }

      const response = await fetch('https://lbmfkppvzimklebisefm.supabase.co/functions/v1/discover-models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ provider })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data.models || [];
    } catch (error) {
      console.error('Erreur appel Edge Function discover-models:', error);
      throw error;
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
          id: 'claude-opus-4-20250514',
          name: 'Claude 4 Opus',
          description: 'Le modèle le plus puissant avec capacités de raisonnement supérieures',
          contextWindow: 200000,
          maxTokens: 8192,
          supportsVision: true,
          pricing: { input: 0.015, output: 0.075 }
        },
        {
          id: 'claude-sonnet-4-20250514',
          name: 'Claude 4 Sonnet',
          description: 'Modèle haute performance avec raisonnement exceptionnel et efficacité',
          contextWindow: 200000,
          maxTokens: 8192,
          supportsVision: true,
          pricing: { input: 0.003, output: 0.015 }
        },
        {
          id: 'claude-3-5-haiku-20241022',
          name: 'Claude 3.5 Haiku',
          description: 'Le modèle le plus rapide pour les réponses instantanées',
          contextWindow: 200000,
          maxTokens: 8192,
          supportsVision: true,
          pricing: { input: 0.00025, output: 0.00125 }
        },
        {
          id: 'claude-3-7-sonnet-20250219',
          name: 'Claude 3.7 Sonnet',
          description: 'Modèle avec capacités de raisonnement étendues',
          contextWindow: 200000,
          maxTokens: 8192,
          supportsVision: true,
          pricing: { input: 0.003, output: 0.015 }
        },
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet',
          description: 'Modèle intelligent de génération 3.5',
          contextWindow: 200000,
          maxTokens: 8192,
          supportsVision: true,
          pricing: { input: 0.003, output: 0.015 }
        },
        {
          id: 'claude-3-opus-20240229',
          name: 'Claude 3 Opus',
          description: 'Modèle puissant de génération 3',
          contextWindow: 200000,
          maxTokens: 8192,
          supportsVision: true,
          pricing: { input: 0.015, output: 0.075 }
        },
        {
          id: 'claude-3-sonnet-20240229',
          name: 'Claude 3 Sonnet',
          description: 'Modèle équilibré de génération 3',
          contextWindow: 200000,
          maxTokens: 8192,
          supportsVision: true,
          pricing: { input: 0.003, output: 0.015 }
        },
        {
          id: 'claude-3-haiku-20240307',
          name: 'Claude 3 Haiku',
          description: 'Modèle rapide et économique de génération 3',
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