
import { supabase } from "@/integrations/supabase/client";

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

class ModelDiscoveryService {
  async discoverAvailableModels(provider: 'openai' | 'anthropic' | 'google'): Promise<ProviderModels> {
    try {
      const { data, error } = await supabase.functions.invoke('discover-models', {
        body: { provider }
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        provider,
        models: data.models,
        error: data.error
      };
    } catch (error) {
      return {
        provider,
        models: [],
        error: error.message || `Erreur lors de la découverte des modèles ${provider}`
      };
    }
  }

  async testApiKey(provider: 'openai' | 'anthropic' | 'google', apiKey: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('test-api-key', {
        body: { provider, apiKey }
      });

      if (error) {
        return false;
      }

      return data.valid === true;
    } catch (error) {
      console.error(`Erreur lors du test de la clé API ${provider}:`, error);
      return false;
    }
  }
}

export const modelDiscoveryService = new ModelDiscoveryService();
