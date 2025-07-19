
import { GenerationPrompt } from "../types";
import { toast } from "sonner";
import { SecureLLMService, SecureLLMResponse } from "./secureLLMService";
import type { LLMConfig } from "./secureLLMService";

export interface LLMResponse {
  titles: string[];
  descriptions: string[];
  provider: string;
  model: string;
  tokensUsed?: number;
}

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

// Export LLMConfig type from secureLLMService for backward compatibility
export type { LLMConfig } from "./secureLLMService";

class LLMApiService {
  private defaultRetryOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000
  };

  async generateContentWithRetry(configs: LLMConfig[], prompt: GenerationPrompt, retryOptions?: Partial<RetryOptions>): Promise<LLMResponse> {
    console.log("🔒 Utilisation du service LLM sécurisé");
    
    try {
      const response: SecureLLMResponse = await SecureLLMService.generateContent(configs, prompt);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return {
        titles: response.titles || [],
        descriptions: response.descriptions || [],
        provider: response.provider || configs[0]?.provider || 'unknown',
        model: response.model || configs[0]?.model || 'unknown',
        tokensUsed: response.tokensUsed
      };
    } catch (error) {
      console.error("❌ Erreur du service LLM sécurisé:", error);
      throw error;
    }
  }

  async validateApiKeys(): Promise<{ [key: string]: boolean }> {
    return await SecureLLMService.validateApiKeys();
  }
}

export const llmApiService = new LLMApiService();
