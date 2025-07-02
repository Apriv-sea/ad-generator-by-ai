
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
    console.log(`🔍 Découverte des modèles pour ${provider}...`);
    
    try {
      const { data, error } = await supabase.functions.invoke('discover-models', {
        body: { provider }
      });

      console.log(`📊 Réponse de discover-models pour ${provider}:`, { data, error });

      if (error) {
        console.error(`❌ Erreur Edge Function pour ${provider}:`, error);
        throw new Error(error.message);
      }

      if (data?.error) {
        console.error(`❌ Erreur API pour ${provider}:`, data.error);
        return {
          provider,
          models: [],
          error: data.error
        };
      }

      console.log(`✅ Modèles trouvés pour ${provider}:`, data.models);
      
      return {
        provider,
        models: data.models || [],
        error: data.error
      };
    } catch (error) {
      console.error(`❌ Exception lors de la découverte des modèles ${provider}:`, error);
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
