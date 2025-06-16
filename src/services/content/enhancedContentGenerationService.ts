
import { GenerationPrompt } from "../types";
import { llmApiService, LLMResponse } from "../llm/llmApiService";
import { LLMConfig } from "../llm/secureLLMService";
import { contentValidationService, ValidationResult } from "../validation/contentValidationService";
import { contentHistoryService } from "../history/contentHistoryService";
import { toast } from "sonner";

export interface EnhancedGenerationOptions {
  maxRegenerateAttempts?: number;
  validateContent?: boolean;
  saveToHistory?: boolean;
  createBackup?: boolean;
  autoCleanContent?: boolean;
}

export interface EnhancedGenerationResult {
  success: boolean;
  titles: string[];
  descriptions: string[];
  provider: string;
  model: string;
  tokensUsed?: number;
  validationResults?: {
    titles: ValidationResult;
    descriptions: ValidationResult;
  };
  historyId?: string;
  backupId?: string;
  regeneratedCount?: number;
}

class EnhancedContentGenerationService {
  private async getApiConfigs(): Promise<LLMConfig[]> {
    // Use the secure service to validate API keys and create configs
    const validationResult = await llmApiService.validateApiKeys();
    
    const configs: LLMConfig[] = [];
    
    // Ordre de priorité des modèles basé sur les clés API disponibles
    if (validationResult.openai) {
      configs.push({
        provider: 'openai',
        model: 'gpt-4'
      });
      configs.push({
        provider: 'openai',
        model: 'gpt-3.5-turbo'
      });
    }
    
    if (validationResult.anthropic) {
      configs.push({
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229'
      });
    }
    
    if (validationResult.google) {
      configs.push({
        provider: 'google',
        model: 'gemini-pro'
      });
    }
    
    return configs;
  }

  async generateContent(
    prompt: GenerationPrompt, 
    sheetId: string,
    currentSheetData?: any[][],
    options: EnhancedGenerationOptions = {}
  ): Promise<EnhancedGenerationResult> {
    const {
      maxRegenerateAttempts = 2,
      validateContent = true,
      saveToHistory = true,
      createBackup = true,
      autoCleanContent = true
    } = options;

    try {
      console.log("=== Début de la génération de contenu ===");
      
      // Vérifier les configurations disponibles
      const configs = await this.getApiConfigs();
      if (configs.length === 0) {
        toast.error("Aucune clé API configurée. Veuillez configurer au moins une clé API dans les paramètres.");
        return {
          success: false,
          titles: [],
          descriptions: [],
          provider: '',
          model: ''
        };
      }

      console.log(`${configs.length} configurations API disponibles`);

      // Créer un backup avant génération si demandé
      let backupId: string | undefined;
      if (createBackup && currentSheetData) {
        backupId = contentHistoryService.createBackup(
          sheetId,
          currentSheetData,
          [] // Sera mis à jour après génération
        );
      }

      let regenerateCount = 0;
      let lastResponse: LLMResponse | null = null;
      let finalValidationResults: { titles: ValidationResult; descriptions: ValidationResult } | undefined;

      // Boucle de génération avec validation et régénération
      while (regenerateCount <= maxRegenerateAttempts) {
        console.log(`Tentative de génération ${regenerateCount + 1}/${maxRegenerateAttempts + 1}`);
        
        // Appel API avec fallback et retry
        const response = await llmApiService.generateContentWithRetry(configs, prompt);
        lastResponse = response;

        if (!validateContent) {
          // Pas de validation, on retourne directement
          break;
        }

        // Validation du contenu généré
        const titlesValidation = contentValidationService.validateTitlesArray(response.titles);
        const descriptionsValidation = contentValidationService.validateDescriptionsArray(response.descriptions);
        
        finalValidationResults = {
          titles: titlesValidation,
          descriptions: descriptionsValidation
        };

        // Si la validation passe ou qu'on a atteint le max de tentatives
        if (titlesValidation.isValid && descriptionsValidation.isValid) {
          console.log("Validation réussie !");
          break;
        }

        if (regenerateCount >= maxRegenerateAttempts) {
          console.log("Max tentatives atteint, on garde le dernier contenu");
          break;
        }

        // Afficher les erreurs et recommencer
        console.log("Validation échouée, régénération...");
        console.log("Erreurs titres:", titlesValidation.errors);
        console.log("Erreurs descriptions:", descriptionsValidation.errors);
        
        regenerateCount++;
        
        // Attendre un peu avant de régénérer
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!lastResponse) {
        throw new Error("Aucune réponse générée");
      }

      // Nettoyer le contenu si demandé
      let finalTitles = lastResponse.titles;
      let finalDescriptions = lastResponse.descriptions;

      if (autoCleanContent && finalValidationResults) {
        if (finalValidationResults.titles.cleanedContent && Array.isArray(finalValidationResults.titles.cleanedContent)) {
          finalTitles = finalValidationResults.titles.cleanedContent;
        }
        if (finalValidationResults.descriptions.cleanedContent && Array.isArray(finalValidationResults.descriptions.cleanedContent)) {
          finalDescriptions = finalValidationResults.descriptions.cleanedContent;
        }
      }

      // Sauvegarder dans l'historique si demandé
      let historyId: string | undefined;
      if (saveToHistory) {
        historyId = contentHistoryService.saveGeneration({
          sheetId,
          campaignName: prompt.campaignContext,
          adGroupName: prompt.adGroupContext,
          generatedContent: {
            titles: finalTitles,
            descriptions: finalDescriptions
          },
          provider: lastResponse.provider,
          model: lastResponse.model,
          prompt,
          tokensUsed: lastResponse.tokensUsed,
          validationResults: finalValidationResults
        });
      }

      // Messages de statut
      if (finalValidationResults) {
        const totalErrors = finalValidationResults.titles.errors.length + 
                           finalValidationResults.descriptions.errors.length;
        const totalWarnings = finalValidationResults.titles.warnings.length + 
                             finalValidationResults.descriptions.warnings.length;

        if (totalErrors > 0) {
          toast.warning(`Contenu généré avec ${totalErrors} erreur(s) de validation`);
        } else if (totalWarnings > 0) {
          toast.success(`Contenu généré avec ${totalWarnings} avertissement(s)`);
        } else {
          toast.success("Contenu généré et validé avec succès !");
        }
      } else {
        toast.success("Contenu généré avec succès !");
      }

      console.log("=== Génération terminée avec succès ===");

      return {
        success: true,
        titles: finalTitles,
        descriptions: finalDescriptions,
        provider: lastResponse.provider,
        model: lastResponse.model,
        tokensUsed: lastResponse.tokensUsed,
        validationResults: finalValidationResults,
        historyId,
        backupId,
        regeneratedCount: regenerateCount
      };

    } catch (error) {
      console.error("Erreur lors de la génération de contenu:", error);
      toast.error(`Erreur lors de la génération: ${error.message}`);
      
      return {
        success: false,
        titles: [],
        descriptions: [],
        provider: '',
        model: ''
      };
    }
  }

  async revertToBackup(backupId: string): Promise<any[][] | null> {
    const revertData = contentHistoryService.getRevertData(backupId);
    if (revertData) {
      contentHistoryService.markBackupAsUsed(backupId);
      toast.success("Contenu restauré depuis la sauvegarde");
      return revertData;
    } else {
      toast.error("Impossible de restaurer depuis cette sauvegarde");
      return null;
    }
  }

  async getAvailableProviders(): Promise<string[]> {
    const configs = await this.getApiConfigs();
    return configs.map(config => config.provider);
  }

  getHistoryForSheet(sheetId: string) {
    return contentHistoryService.getHistory(sheetId);
  }

  getBackupsForSheet(sheetId: string) {
    return contentHistoryService.getBackups(sheetId);
  }

  getStatsForSheet(sheetId: string) {
    return contentHistoryService.getStats(sheetId);
  }
}

export const enhancedContentGenerationService = new EnhancedContentGenerationService();
