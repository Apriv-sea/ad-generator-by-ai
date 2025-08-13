import { supabase } from '@/integrations/supabase/client';
import { GenerationPrompt } from '../types';

export interface SecureLLMRequest {
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
  messages: Array<{ role: string; content: string }>;
  maxTokens?: number;
  temperature?: number;
}

export interface SecureLLMResponse {
  content?: string;
  titles?: string[];
  descriptions?: string[];
  provider?: string;
  model?: string;
  tokensUsed?: number;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: string;
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
}

export interface APIKeyTestResult {
  isValid: boolean;
  models: string[];
  provider: string;
  error?: string;
}

/**
 * Service sécurisé pour les appels LLM via Edge Functions
 * Remplace les appels directs aux APIs externes
 */
export class SecureLLMService {
  
  /**
   * Génère du contenu via un modèle LLM de manière sécurisée
   * Compatible avec l'ancienne interface pour la migration progressive
   */
  static async generateContent(configs: LLMConfig[] | SecureLLMRequest, prompt?: GenerationPrompt): Promise<SecureLLMResponse> {
    try {
      let request: SecureLLMRequest;
      
      // Handle legacy format
      if (Array.isArray(configs) && prompt) {
        const config = configs[0]; // Use first config for now
        request = {
          provider: config.provider,
          model: config.model,
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant for generating advertising content.' },
            { role: 'user', content: this.buildPromptFromGenerationPrompt(prompt) }
          ],
          maxTokens: 2000,
          temperature: 0.7
        };
      } else if (!Array.isArray(configs)) {
        request = configs as SecureLLMRequest;
      } else {
        throw new Error('Invalid parameters for generateContent');
      }

      console.log('🔒 Secure LLM request:', { provider: request.provider, model: request.model });

      // Get decrypted API key using secure service
      const { EncryptedApiKeyService } = await import('@/services/security/encryptedApiKeyService');
      const hasValidKey = await EncryptedApiKeyService.getDecrypted(request.provider);
      if (!hasValidKey) {
        throw new Error(`Aucune clé API trouvée pour ${request.provider}. Veuillez configurer votre clé API dans les paramètres.`);
      }

      const { data, error } = await supabase.functions.invoke('secure-llm-api', {
        body: request
      });

      if (error) {
        console.error('❌ Secure LLM error:', error);
        throw new Error(`Erreur API: ${error.message}`);
      }

      if (!data) {
        throw new Error('Aucune réponse reçue de l\'API');
      }

      // Vérifier si la réponse contient une erreur
      if (data.error) {
        console.error('❌ LLM response error:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ LLM response received:', data);

      // Normaliser la réponse selon le provider et extraire titles/descriptions si nécessaire
      const normalized = this.normalizeResponse(request.provider, data);
      
      // Si c'est pour la génération de contenu publicitaire, parser le contenu
      if (prompt) {
        const parsed = this.parseAdvertisingContent(normalized.content || '');
        return {
          ...normalized,
          titles: parsed.titles,
          descriptions: parsed.descriptions,
          provider: request.provider,
          model: request.model,
          tokensUsed: normalized.usage?.total_tokens
        };
      }
      
      return normalized;
      
    } catch (error) {
      console.error('💥 Secure LLM service error:', error);
      return {
        error: error instanceof Error ? error.message : 'Erreur inconnue lors de la génération'
      };
    }
  }

  /**
   * Teste une clé API de manière sécurisée
   */
  static async testAPIKey(provider: 'openai' | 'anthropic' | 'google', apiKey: string): Promise<APIKeyTestResult> {
    try {
      console.log('🧪 Testing API key for provider:', provider);

      const { data, error } = await supabase.functions.invoke('test-api-key-secure', {
        body: { provider, apiKey }
      });

      if (error) {
        console.error('❌ API key test error:', error);
        return {
          isValid: false,
          models: [],
          provider,
          error: error.message
        };
      }

      console.log('✅ API key test result:', data);
      return data;
      
    } catch (error) {
      console.error('💥 API key test service error:', error);
      return {
        isValid: false,
        models: [],
        provider,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Normalise les réponses des différents providers
   */
  private static normalizeResponse(provider: string, data: any): SecureLLMResponse {
    switch (provider) {
      case 'openai':
        return {
          content: data.choices?.[0]?.message?.content || '',
          usage: data.usage
        };
        
      case 'anthropic':
        return {
          content: data.content?.[0]?.text || '',
          usage: {
            prompt_tokens: data.usage?.input_tokens || 0,
            completion_tokens: data.usage?.output_tokens || 0,
            total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
          }
        };
        
      case 'google':
        return {
          content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
          usage: {
            prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
            completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
            total_tokens: data.usageMetadata?.totalTokenCount || 0
          }
        };
        
      default:
        return {
          content: data.content || '',
          usage: data.usage
        };
    }
  }

  /**
   * Vérifie si l'utilisateur a une clé API valide pour un provider
   */
  static async hasValidAPIKey(provider: 'openai' | 'anthropic' | 'google'): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check for encrypted keys first
      const { EncryptedApiKeyService } = await import('@/services/security/encryptedApiKeyService');
      const decryptedKey = await EncryptedApiKeyService.getDecrypted(provider);
      
      if (decryptedKey) {
        return true;
      }

      // Fallback: check for unencrypted keys (legacy)
      const { data, error } = await supabase
        .from('api_keys')
        .select('api_key')
        .eq('user_id', user.id)
        .eq('service', provider)
        .single();

      return !error && !!data?.api_key;
    } catch (error) {
      console.error('Error checking API key:', error);
      return false;
    }
  }

  /**
   * Valide toutes les clés API de l'utilisateur
   */
  static async validateApiKeys(): Promise<{ [key: string]: boolean }> {
    const providers: ('openai' | 'anthropic' | 'google')[] = ['openai', 'anthropic', 'google'];
    const results: { [key: string]: boolean } = {};
    
    for (const provider of providers) {
      results[provider] = await this.hasValidAPIKey(provider);
    }
    
    return results;
  }

  /**
   * Construit un prompt à partir d'un GenerationPrompt
   */
  private static buildPromptFromGenerationPrompt(prompt: GenerationPrompt): string {
    return `
Génère des annonces publicitaires pour les mots-clés suivants : ${prompt.keywords?.join(', ')}

Contexte client : ${prompt.clientContext || 'Non spécifié'}
Contexte campagne : ${prompt.campaignContext || 'Non spécifié'}
Contexte groupe d'annonces : ${prompt.adGroupContext || 'Non spécifié'}

Instructions : 
- Génère 3 titres d'annonces accrocheurs (max 30 caractères chacun)
- Génère 3 descriptions d'annonces persuasives (max 90 caractères chacune)
- Utilise les mots-clés de manière naturelle
- Respecte le ton et les directives du client

Formate la réponse ainsi :
TITRES:
1. [titre1]
2. [titre2]  
3. [titre3]

DESCRIPTIONS:
1. [description1]
2. [description2]
3. [description3]
    `.trim();
  }

  /**
   * Parse le contenu pour extraire titres et descriptions
   */
  private static parseAdvertisingContent(content: string): { titles: string[], descriptions: string[] } {
    const titles: string[] = [];
    const descriptions: string[] = [];
    
    const lines = content.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.toUpperCase().includes('TITRES')) {
        currentSection = 'titles';
        continue;
      }
      
      if (trimmed.toUpperCase().includes('DESCRIPTIONS')) {
        currentSection = 'descriptions';
        continue;
      }
      
      // Extract numbered items
      const match = trimmed.match(/^\d+\.\s*(.+)$/);
      if (match) {
        const text = match[1].trim();
        if (currentSection === 'titles') {
          titles.push(text);
        } else if (currentSection === 'descriptions') {
          descriptions.push(text);
        }
      }
    }
    
    return { titles, descriptions };
  }
}