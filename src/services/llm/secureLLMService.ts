
import { supabase } from "@/integrations/supabase/client";
import { GenerationPrompt } from "../types";
import { toast } from "sonner";
import { SecurityHeadersService } from "../security/securityHeadersService";

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
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  private readonly RATE_LIMIT_PER_MINUTE = 10;
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = this.rateLimitMap.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      this.rateLimitMap.set(userId, { count: 1, resetTime: now + this.RATE_LIMIT_WINDOW });
      return true;
    }

    if (userLimit.count >= this.RATE_LIMIT_PER_MINUTE) {
      return false;
    }

    userLimit.count++;
    return true;
  }

  async generateContent(configs: LLMConfig[], prompt: GenerationPrompt): Promise<SecureLLMResponse> {
    // Enhanced authentication check
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      console.error("Authentication error:", sessionError);
      throw new Error("Vous devez être connecté pour utiliser cette fonctionnalité");
    }

    // Rate limiting
    if (!this.checkRateLimit(session.user.id)) {
      console.warn("Rate limit exceeded for user:", session.user.id);
      throw new Error("Limite de requêtes dépassée. Veuillez attendre avant de réessayer.");
    }

    // Security audit log
    console.log("Security audit: LLM request initiated", {
      userId: session.user.id,
      timestamp: new Date().toISOString(),
      providersRequested: configs.map(c => c.provider),
      promptLength: JSON.stringify(prompt).length
    });

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
          },
          headers: SecurityHeadersService.enhanceRequest().headers
        });

        if (error) {
          throw new Error(error.message || `Erreur lors de l'appel à ${config.provider}`);
        }

        if (data.error) {
          throw new Error(data.error);
        }

        // Security audit log for successful generation
        console.log("Security audit: LLM generation successful", {
          userId: session.user.id,
          provider: config.provider,
          model: config.model,
          tokensUsed: data.tokensUsed,
          timestamp: new Date().toISOString()
        });

        console.log(`Succès avec ${config.provider} - ${config.model}`);
        return data;

      } catch (error) {
        lastError = error as Error;
        console.error(`Erreur avec ${config.provider}:`, error);
        
        // Enhanced error logging for security monitoring
        console.log("Security audit: LLM provider error", {
          userId: session.user.id,
          provider: config.provider,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        // If it's an API key issue, show helpful message
        if (error.message?.includes('No API key found')) {
          toast.error(`Clé API manquante pour ${config.provider}. Veuillez l'ajouter dans les paramètres.`);
        }
      }
    }

    // Security audit log for complete failure
    console.log("Security audit: All LLM providers failed", {
      userId: session.user.id,
      error: lastError?.message,
      timestamp: new Date().toISOString()
    });

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
        
        // Security audit log
        console.log("Security audit: API key validation error", {
          userId: session.user.id,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        return {};
      }

      const validationResult: { [key: string]: boolean } = {};
      const availableServices = apiKeys?.map(key => key.service) || [];
      
      ['openai', 'anthropic', 'google'].forEach(service => {
        validationResult[service] = availableServices.includes(service);
      });

      // Security audit log
      console.log("Security audit: API key validation completed", {
        userId: session.user.id,
        availableServices,
        timestamp: new Date().toISOString()
      });

      return validationResult;
    } catch (error) {
      console.error('Erreur lors de la validation des clés API:', error);
      return {};
    }
  }
}

export const secureLLMService = new SecureLLMService();
