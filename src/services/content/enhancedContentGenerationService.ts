import { contentHistoryService, GenerationHistory, GenerationBackup } from "../history/contentHistoryService";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/services/utils/supabaseUtils";
import { PromptTemplates, PromptVariables } from "./promptTemplates";

interface GenerationOptions {
  validateContent?: boolean;
  saveToHistory?: boolean;
  createBackup?: boolean;
  autoCleanContent?: boolean;
  maxRegenerateAttempts?: number;
}

interface GenerationPrompt {
  clientContext: string;
  campaignContext: string;
  adGroupContext: string;
  keywords: string[];
  model?: string;
}

interface GenerationResult {
  success: boolean;
  titles: string[];
  descriptions: string[];
  provider: string;
  model: string;
  tokensUsed?: number;
  validationResults?: any;
}

class EnhancedContentGenerationService {
  private backupStorage: Map<string, GenerationBackup[]> = new Map();
  private compressionEnabled = true;

  // Extraire le provider et le modèle du format "provider:model"
  private parseModelString(modelString: string): { provider: string; model: string } {
    if (modelString.includes(':')) {
      const [provider, model] = modelString.split(':');
      return { provider, model };
    }
    
    // Fallback pour les anciens formats
    if (modelString.startsWith('claude')) {
      return { provider: 'anthropic', model: modelString };
    } else if (modelString.startsWith('gpt')) {
      return { provider: 'openai', model: modelString };
    } else if (modelString.startsWith('gemini')) {
      return { provider: 'google', model: modelString };
    }
    
    // Défaut
    return { provider: 'openai', model: modelString };
  }

  async generateContent(
    prompt: GenerationPrompt,
    sheetId: string,
    currentData?: any[][],
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    try {
      // Créer une sauvegarde avant la génération si demandé
      if (options.createBackup && currentData) {
        await this.createBackup(sheetId, currentData);
      }

      // Parser le modèle pour extraire provider et modèle
      const { provider, model } = this.parseModelString(prompt.model || 'gpt-4');
      
      console.log(`🎯 Génération avec: ${provider} - ${model}`);

      // Construire les variables pour le template - SANS limitation de taille
      const promptVariables: PromptVariables = {
        adGroupName: prompt.adGroupContext,
        keywords: prompt.keywords.join(', '), // Tous les mots-clés sans limitation
        clientContext: prompt.clientContext, // Contexte client complet
        campaignContext: prompt.campaignContext
      };

      // Générer les titres avec le template complet
      const titlesPrompt = PromptTemplates.buildTitlesPrompt(promptVariables);
      console.log(`📝 Prompt titres (${provider}):`, titlesPrompt.substring(0, 200) + "...");

      const { data: titlesData, error: titlesError } = await supabase.functions.invoke('llm-generation', {
        body: {
          prompt: titlesPrompt,
          model: model,
          provider: provider // Utiliser le provider extrait
        }
      });

      if (titlesError) {
        console.error(`❌ Erreur génération titres (${provider}):`, titlesError);
        throw titlesError;
      }

      console.log(`✅ Réponse titres (${provider}):`, titlesData);

      // Générer les descriptions avec un prompt séparé complet
      const descriptionsPrompt = PromptTemplates.buildDescriptionsPrompt(promptVariables);
      console.log(`📝 Prompt descriptions (${provider}):`, descriptionsPrompt.substring(0, 200) + "...");

      const { data: descriptionsData, error: descriptionsError } = await supabase.functions.invoke('llm-generation', {
        body: {
          prompt: descriptionsPrompt,
          model: model,
          provider: provider // Utiliser le provider extrait
        }
      });

      if (descriptionsError) {
        console.error(`❌ Erreur génération descriptions (${provider}):`, descriptionsError);
        throw descriptionsError;
      }

      console.log(`✅ Réponse descriptions (${provider}):`, descriptionsData);

      // Parser les résultats selon le format attendu du provider
      const parsedTitles = PromptTemplates.parseGeneratedTitles(
        this.extractContent(titlesData, provider)
      );

      const parsedDescriptions = PromptTemplates.parseGeneratedDescriptions(
        this.extractContent(descriptionsData, provider)
      );

      console.log(`📊 Titres extraits (${provider}):`, parsedTitles);
      console.log(`📊 Descriptions extraites (${provider}):`, parsedDescriptions);

      const result: GenerationResult = {
        success: true,
        titles: parsedTitles,
        descriptions: parsedDescriptions,
        provider: provider,
        model: model,
        tokensUsed: this.extractTokenUsage(titlesData, descriptionsData, provider),
        validationResults: {
          titlesValidation: parsedTitles.map(title => ({ 
            text: title, 
            valid: title.length <= 30,
            length: title.length 
          })),
          descriptionsValidation: parsedDescriptions.map(desc => ({ 
            text: desc, 
            valid: desc.length <= 90,
            length: desc.length 
          }))
        }
      };

      // Sauvegarder dans l'historique si demandé
      if (options.saveToHistory) {
        await contentHistoryService.saveGeneration({
          sheetId,
          campaignName: prompt.campaignContext,
          adGroupName: prompt.adGroupContext,
          generatedContent: {
            titles: result.titles,
            descriptions: result.descriptions
          },
          provider: result.provider,
          model: result.model,
          promptData: prompt,
          tokensUsed: result.tokensUsed,
          validationResults: result.validationResults
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Erreur dans enhancedContentGenerationService:', error);
      return {
        success: false,
        titles: [],
        descriptions: [],
        provider: 'unknown',
        model: prompt.model || 'unknown'
      };
    }
  }

  // Extraire le contenu selon le format de réponse du provider
  private extractContent(data: any, provider: string): string {
    if (!data) return '';
    
    switch (provider) {
      case 'openai':
        return data.choices?.[0]?.message?.content || data.content || '';
      
      case 'anthropic':
        return data.content?.[0]?.text || data.message || data.content || '';
      
      case 'google':
        return data.candidates?.[0]?.content?.parts?.[0]?.text || data.content || '';
      
      default:
        // Essayer plusieurs formats
        return data.choices?.[0]?.message?.content || 
               data.content?.[0]?.text || 
               data.message || 
               data.content || 
               '';
    }
  }

  // Extraire l'usage des tokens selon le provider
  private extractTokenUsage(titlesData: any, descriptionsData: any, provider: string): number {
    let totalTokens = 0;
    
    switch (provider) {
      case 'openai':
        totalTokens = (titlesData.usage?.total_tokens || 0) + (descriptionsData.usage?.total_tokens || 0);
        break;
      
      case 'anthropic':
        totalTokens = (titlesData.usage?.input_tokens || 0) + (titlesData.usage?.output_tokens || 0) +
                      (descriptionsData.usage?.input_tokens || 0) + (descriptionsData.usage?.output_tokens || 0);
        break;
      
      case 'google':
        totalTokens = (titlesData.usageMetadata?.totalTokenCount || 0) + 
                      (descriptionsData.usageMetadata?.totalTokenCount || 0);
        break;
    }
    
    return totalTokens;
  }

  async generateContentWithHistory(
    sheetId: string,
    campaignName: string,
    adGroupName: string,
    generationData: any,
    provider: string,
    model: string
  ): Promise<any> {
    try {
      // Créer une sauvegarde avant la génération
      await this.createBackup(sheetId, generationData.currentContent || []);

      // Appeler le service de génération existant
      const { data, error } = await supabase.functions.invoke('llm-generation', {
        body: {
          ...generationData,
          provider,
          model
        }
      });

      if (error) throw error;

      // Sauvegarder dans l'historique
      await contentHistoryService.saveGeneration({
        sheetId,
        campaignName,
        adGroupName,
        generatedContent: data.content,
        provider,
        model,
        promptData: generationData,
        tokensUsed: data.tokensUsed,
        validationResults: data.validation
      });

      return data;
    } catch (error) {
      console.error('Error in enhanced content generation:', error);
      throw error;
    }
  }

  private buildPrompt(prompt: GenerationPrompt): string {
    return `
Contexte client: ${prompt.clientContext}
Campagne: ${prompt.campaignContext}
Groupe d'annonces: ${prompt.adGroupContext}
Mots-clés: ${prompt.keywords.join(', ')}

Génère 3 titres et 2 descriptions pour cette campagne publicitaire.
`;
  }

  async createBackup(sheetId: string, content: any[][]): Promise<string> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      // Compression des données si activée
      const backupData = this.compressionEnabled ? 
        this.compressData(content) : content;

      const { data, error } = await supabase.functions.invoke('create_automatic_backup', {
        body: {
          backup_type: 'sheet_data',
          data_reference: sheetId,
          backup_data: backupData
        }
      });

      if (error) throw error;

      // Ajouter au cache local
      const backup: GenerationBackup = {
        id: data.id,
        previousContent: content,
        timestamp: new Date(),
        canRevert: true
      };

      const existingBackups = this.backupStorage.get(sheetId) || [];
      existingBackups.unshift(backup);
      
      // Garder seulement les 10 dernières sauvegardes en mémoire
      if (existingBackups.length > 10) {
        existingBackups.splice(10);
      }
      
      this.backupStorage.set(sheetId, existingBackups);

      return data.id;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  async revertToBackup(backupId: string): Promise<any[][] | null> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('data_backups')
        .select('*')
        .eq('id', backupId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        console.error('Backup not found:', error);
        return null;
      }

      // Décompresser les données si nécessaire
      const restoredData = this.compressionEnabled ? 
        this.decompressData(data.backup_data) : data.backup_data;

      // Marquer comme utilisé dans le cache local
      for (const [sheetId, backups] of this.backupStorage.entries()) {
        const backup = backups.find(b => b.id === backupId);
        if (backup) {
          backup.canRevert = false;
          break;
        }
      }

      return restoredData;
    } catch (error) {
      console.error('Error reverting backup:', error);
      return null;
    }
  }

  async getHistoryForSheet(sheetId: string): Promise<GenerationHistory[]> {
    return await contentHistoryService.getHistoryForSheet(sheetId);
  }

  getBackupsForSheet(sheetId: string): GenerationBackup[] {
    return this.backupStorage.get(sheetId) || [];
  }

  getStatsForSheet(sheetId: string): any {
    // Cette méthode doit être async maintenant
    return this.getStatsForSheetAsync(sheetId);
  }

  private async getStatsForSheetAsync(sheetId: string): Promise<any> {
    const history = await this.getHistoryForSheet(sheetId);
    const backups = this.getBackupsForSheet(sheetId);

    const providersUsed = history.reduce((acc, item) => {
      acc[item.provider] = (acc[item.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalTokens = history.reduce((sum, item) => sum + (item.tokensUsed || 0), 0);

    return {
      totalGenerations: history.length,
      totalBackups: backups.length,
      averageTokensUsed: history.length > 0 ? Math.round(totalTokens / history.length) : 0,
      providersUsed
    };
  }

  private compressData(data: any): any {
    // Implémentation simple de compression - peut être améliorée
    try {
      const jsonString = JSON.stringify(data);
      // Simuler une compression simple en supprimant les espaces
      return {
        compressed: true,
        data: jsonString.replace(/\s+/g, ' ').trim(),
        originalSize: jsonString.length
      };
    } catch {
      return data;
    }
  }

  private decompressData(compressedData: any): any {
    if (compressedData?.compressed) {
      try {
        return JSON.parse(compressedData.data);
      } catch {
        return compressedData.data;
      }
    }
    return compressedData;
  }
}

export const enhancedContentGenerationService = new EnhancedContentGenerationService();
