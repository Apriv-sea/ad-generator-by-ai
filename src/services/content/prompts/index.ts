// Point d'entrée centralisé pour le système de prompts dynamiques

export { PromptBuilder, type PromptVariables, type PromptBuilderOptions } from './promptBuilder';
export { ResponseValidator, type ValidationResult, type ValidationRules } from './responseValidator';
export { 
  INDUSTRY_PROMPTS, 
  normalizeIndustryName, 
  type IndustryPromptConfig 
} from './industryPrompts';

import { PromptBuilder, type PromptVariables } from './promptBuilder';
import { ResponseValidator, type ValidationResult } from './responseValidator';
import { INDUSTRY_PROMPTS } from './industryPrompts';

// Utilitaires pour faciliter l'utilisation
export class PromptSystemUtils {
  /**
   * Génère un prompt optimisé avec validation automatique
   */
  static generateOptimizedPrompt(variables: PromptVariables): string {
    return PromptBuilder.buildDynamicPrompt(variables, {
      includeIndustrySpecifics: true,
      includePersonaAdaptation: true,
      enhancedValidation: true,
      strictFormatting: true
    });
  }

  /**
   * Valide une réponse avec correction automatique
   */
  static validateResponse(content: string): ValidationResult {
    return ResponseValidator.validateAndCorrect(content, {
      strictValidation: true,
      maxTitleLength: 30,
      maxDescriptionLength: 90,
      minDescriptionLength: 55,
      requiredTitlesCount: 15,
      requiredDescriptionsCount: 4
    });
  }

  /**
   * Obtient les suggestions d'amélioration pour un secteur
   */
  static getIndustrySuggestions(industry?: string) {
    return PromptBuilder.getIndustrySuggestions(industry);
  }

  /**
   * Liste tous les secteurs supportés
   */
  static getSupportedIndustries(): string[] {
    return Object.keys(INDUSTRY_PROMPTS).filter(key => key !== 'default');
  }
}