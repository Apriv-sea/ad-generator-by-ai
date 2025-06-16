
import { GenerationPrompt } from "../types";
import { toast } from "sonner";
import { secureLLMService, SecureLLMResponse } from "./secureLLMService";
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
      // Convert old LLMConfig format to new format
      const secureConfigs = configs.map(config => ({
        provider: config.provider,
        model: config.model
      }));

      const response: SecureLLMResponse = await secureLLMService.generateContent(secureConfigs, prompt);
      
      return {
        titles: response.titles,
        descriptions: response.descriptions,
        provider: response.provider,
        model: response.model,
        tokensUsed: response.tokensUsed
      };
    } catch (error) {
      console.error("❌ Erreur du service LLM sécurisé:", error);
      throw error;
    }
  }

  async validateApiKeys(): Promise<{ [key: string]: boolean }> {
    return await secureLLMService.validateApiKeys();
  }
}

export const llmApiService = new LLMApiService();
