
import { supabase } from "@/integrations/supabase/client";
import { GenerationPrompt } from "../types";
import { toast } from "sonner";

export interface SecureLLMResponse {
  titles: string[];
  descriptions: string[];
  provider: string;
  model: string;
  tokensUsed?: number;
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
}

class SecureLLMService {
  async generateContent(configs: LLMConfig[], prompt: GenerationPrompt): Promise<SecureLLMResponse> {
    // Ensure user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error("Vous devez être connecté pour utiliser cette fonctionnalité");
    }

    let lastError: Error | null = null;

    // Try each configuration (fallback between providers)
    for (const config of configs) {
      try {
        console.log(`Tentative avec ${config.provider} - ${config.model}`);
        
        const { data, error } = await supabase.functions.invoke('llm-generation', {
          body: {
            prompt,
            provider: config.provider,
            model: config.model
          }
        });

        if (error) {
          throw new Error(error.message || `Erreur lors de l'appel à ${config.provider}`);
        }

        if (data.error) {
          throw new Error(data.error);
        }

        console.log(`Succès avec ${config.provider} - ${config.model}`);
        return data;

      } catch (error) {
        lastError = error as Error;
        console.error(`Erreur avec ${config.provider}:`, error);
        
        // If it's an API key issue, show helpful message
        if (error.message?.includes('No API key found')) {
          toast.error(`Clé API manquante pour ${config.provider}. Veuillez l'ajouter dans les paramètres.`);
        }
      }
    }

    // If all providers failed
    throw new Error(`Tous les providers ont échoué. Dernière erreur: ${lastError?.message}`);
  }

  async validateApiKeys(): Promise<{ [key: string]: boolean }> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        return {};
      }

      const { data: apiKeys, error } = await supabase
        .from('api_keys')
        .select('service')
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Erreur lors de la validation des clés API:', error);
        return {};
      }

      const validationResult: { [key: string]: boolean } = {};
      const availableServices = apiKeys?.map(key => key.service) || [];
      
      ['openai', 'anthropic', 'google'].forEach(service => {
        validationResult[service] = availableServices.includes(service);
      });

      return validationResult;
    } catch (error) {
      console.error('Erreur lors de la validation des clés API:', error);
      return {};
    }
  }
}

export const secureLLMService = new SecureLLMService();
