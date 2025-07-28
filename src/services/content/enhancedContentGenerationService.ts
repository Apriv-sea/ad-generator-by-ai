
import { supabase } from '@/integrations/supabase/client';
import { googleSheetsCoreService } from '@/services/core/googleSheetsCore';
import { ColumnMappingService } from '@/services/googlesheets/columnMappingService';
import { UnifiedPromptService } from './unifiedPromptService';

export interface ContentGenerationOptions {
  model: string;
  clientContext: string;
  industry?: string;              // Nouveau champ
  targetPersona?: string;         // Nouveau champ
  campaignContext: string;
  adGroupContext: string;
  keywords: string[];
  validateContent?: boolean;
  saveToHistory?: boolean;
  createBackup?: boolean;
  autoCleanContent?: boolean;
  maxRegenerateAttempts?: number;
}

export interface ContentGenerationResult {
  success: boolean;
  titles?: string[];
  descriptions?: string[];
  error?: string;
  tokensUsed?: number;
  validationResults?: any;
}

export class EnhancedContentGenerationService {
  static async generateContent(
    options: ContentGenerationOptions,
    sheetId: string,
    currentSheetData: any[][],
    config?: {
      validateContent?: boolean;
      saveToHistory?: boolean;
      createBackup?: boolean;
      autoCleanContent?: boolean;
      maxRegenerateAttempts?: number;
    }
  ): Promise<ContentGenerationResult> {
    try {
      console.log('🚀 === DEBUT GENERATION CONTENU AMELIOREE ===');
      console.log('📊 Options:', options);
      console.log('📋 Feuille ID:', sheetId);

      // Construire le prompt optimisé
      const prompt = this.buildOptimizedPrompt(options);
      console.log('📝 Prompt construit:', prompt.substring(0, 200) + '...');

      // Déterminer le provider et le modèle depuis la sélection
      let { provider, model } = this.parseModelSelection(options.model);
      
      // FALLBACK: Si c'est un vieux modèle Claude, forcer vers Claude 4 Sonnet
      if (provider === 'anthropic' && (model.includes('claude-3-sonnet-20240229') || model.includes('claude-3') || model === 'claude-3')) {
        console.log(`⚠️ Modèle obsolète détecté (${model}), passage forcé vers Claude 4 Sonnet`);
        model = 'claude-sonnet-4-20250514';
      }
      
      console.log('🎯 Provider/Modèle finaux:', { provider, model });

      // Appeler l'API de génération sécurisée avec le bon provider
      const response = await supabase.functions.invoke('secure-llm-api', {
        body: {
          provider,
          model,
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant for generating advertising content.' },
            { role: 'user', content: prompt }
          ],
          maxTokens: 2000,
          temperature: 0.7
        }
      });

      console.log('🔄 Réponse API:', response);

      if (response.error) {
        console.error('❌ Erreur API:', response.error);
        return {
          success: false,
          error: `Erreur API: ${response.error.message || response.error}`
        };
      }

      // CORRECTION CRITIQUE: Extraire le contenu selon le provider
      console.log('🔍 Structure complète de response.data:', JSON.stringify(response.data, null, 2));
      
      let generatedContent;
      
      // Pour Anthropic
      if (provider === 'anthropic') {
        generatedContent = response.data?.content?.[0]?.text;
        console.log('🔍 Extraction Anthropic - contenu:', generatedContent);
      }
      // Pour OpenAI  
      else if (provider === 'openai') {
        generatedContent = response.data?.choices?.[0]?.message?.content;
        console.log('🔍 Extraction OpenAI - contenu:', generatedContent);
      }
      // Pour Google
      else if (provider === 'google') {
        generatedContent = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('🔍 Extraction Google - contenu:', generatedContent);
      }
      
      if (!generatedContent) {
        console.error('❌ Pas de contenu généré:', {
          provider,
          responseData: response.data,
          responseKeys: Object.keys(response.data || {})
        });
        return {
          success: false,
          error: `Aucun contenu généré par l'IA (provider: ${provider})`
        };
      }

      console.log('✅ Contenu généré reçu:', generatedContent.substring(0, 300) + '...');

      // Parser le contenu JSON
      const parsedContent = this.parseGeneratedContent(generatedContent);
      
      if (!parsedContent.success) {
        console.error('❌ Erreur parsing:', parsedContent.error);
        return {
          success: false,
          error: `Erreur de parsing: ${parsedContent.error}`
        };
      }

      console.log('✅ Contenu parsé:', parsedContent);

      // Sauvegarder l'historique si demandé
      if (config?.saveToHistory) {
        await this.saveToHistory(options, parsedContent, sheetId);
      }

      return {
        success: true,
        titles: parsedContent.titles,
        descriptions: parsedContent.descriptions,
        tokensUsed: response.data?.usage?.total_tokens || response.data?.usage?.input_tokens + response.data?.usage?.output_tokens || 0
      };

    } catch (error) {
      console.error('❌ === ERREUR GENERATION CONTENU ===', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  private static buildOptimizedPrompt(options: ContentGenerationOptions): string {
    return UnifiedPromptService.buildUnifiedPrompt({
      clientContext: options.clientContext,
      industry: options.industry,
      targetPersona: options.targetPersona,
      campaignContext: options.campaignContext,
      adGroupContext: options.adGroupContext,
      keywords: options.keywords,
      model: options.model
    });
  }

  private static parseGeneratedContent(content: string): {
    success: boolean;
    titles?: string[];
    descriptions?: string[];
    error?: string;
  } {
    return UnifiedPromptService.parseGeneratedContent(content);
  }

  private static async saveToHistory(
    options: ContentGenerationOptions,
    content: any,
    sheetId: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Déterminer le provider basé sur le modèle
      const { provider } = this.parseModelSelection(options.model);

      await supabase.from('content_generations').insert({
        user_id: user.id,
        sheet_id: sheetId,
        campaign_name: options.campaignContext,
        ad_group_name: options.adGroupContext,
        provider,
        model: options.model,
        prompt_data: {
          clientContext: options.clientContext,
          keywords: options.keywords
        },
        generated_content: content,
        tokens_used: 0
      });
    } catch (error) {
      console.error('Erreur sauvegarde historique:', error);
    }
  }

  static async generateAndSaveContent(
    options: ContentGenerationOptions,
    sheetId: string,
    rowIndex: number,
    currentSheetData: any[][]
  ): Promise<{
    success: boolean;
    updatedSheetData?: any[][];
    error?: string;
  }> {
    try {
      console.log(`🎯 === GENERATION ET SAUVEGARDE LIGNE ${rowIndex + 1} ===`);
      console.log('📊 Données feuille actuelles:', {
        totalRows: currentSheetData.length,
        headers: currentSheetData[0],
        targetRowIndex: rowIndex,
        targetRowData: currentSheetData[rowIndex]
      });
      
      // Analyser la structure de la feuille
      const structureAnalysis = await ColumnMappingService.analyzeSheetStructure(sheetId);
      
      if (!structureAnalysis.isValid) {
        console.error('❌ Structure feuille invalide:', structureAnalysis.errors);
        return {
          success: false,
          error: `Structure feuille invalide: ${structureAnalysis.errors.join(', ')}`
        };
      }

      console.log('📊 Structure feuille validée:', structureAnalysis.mappings);

      // Générer le contenu
      const result = await this.generateContent(options, sheetId, currentSheetData);
      
      if (!result.success || !result.titles || !result.descriptions) {
        console.error('❌ Génération échouée:', result.error);
        return {
          success: false,
          error: result.error || 'Génération échouée'
        };
      }

      console.log('✅ Contenu généré:', {
        titles: result.titles,
        descriptions: result.descriptions
      });

      // Appliquer les résultats à la ligne
      const updatedSheetData = [...currentSheetData];
      const originalRow = updatedSheetData[rowIndex] || [];
      
      console.log('📝 Avant application des résultats:', {
        rowIndex,
        originalRow: originalRow.slice(0, 10),
        rowLength: originalRow.length
      });
      
      const updatedRow = ColumnMappingService.applyGenerationResults(
        originalRow,
        result.titles,
        result.descriptions,
        structureAnalysis.mappings
      );

      updatedSheetData[rowIndex] = updatedRow;

      console.log('📝 Après application des résultats:', {
        originalRow: originalRow.slice(0, 10),
        updatedRow: updatedRow.slice(0, 10),
        fullUpdatedRow: updatedRow
      });

      // Sauvegarder dans Google Sheets
      console.log('💾 Tentative sauvegarde Google Sheets...');
      console.log('📊 Données à sauvegarder:', {
        sheetId,
        dataSize: updatedSheetData.length + 'x' + (updatedSheetData[0]?.length || 0),
        firstRow: updatedSheetData[0],
        updatedTargetRow: updatedSheetData[rowIndex]
      });
      
      const saveSuccess = await googleSheetsCoreService.saveSheetData(sheetId, updatedSheetData);
      
      if (!saveSuccess) {
        console.error('❌ Échec sauvegarde Google Sheets');
        return {
          success: false,
          error: 'Échec de la sauvegarde dans Google Sheets'
        };
      }

      console.log('✅ Sauvegarde Google Sheets réussie');

      return {
        success: true,
        updatedSheetData
      };

    } catch (error) {
      console.error('❌ === ERREUR GENERATION ET SAUVEGARDE ===', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  private static parseModelSelection(modelSelection: string): { provider: string; model: string } {
    // Si le modèle contient ":", c'est le format "provider:model"
    if (modelSelection && modelSelection.includes(':')) {
      const [provider, model] = modelSelection.split(':');
      return { provider, model };
    }

    // Sinon, détecter le provider basé sur le nom du modèle
    if (!modelSelection) {
      return { provider: 'anthropic', model: 'claude-sonnet-4-20250514' };
    }

    // Modèles OpenAI
    if (modelSelection.includes('gpt') || modelSelection.includes('o1')) {
      return { provider: 'openai', model: modelSelection };
    }

    // Modèles Anthropic
    if (modelSelection.includes('claude')) {
      return { provider: 'anthropic', model: modelSelection };
    }

    // Modèles Google
    if (modelSelection.includes('gemini')) {
      return { provider: 'google', model: modelSelection };
    }

    // Par défaut, utiliser Claude 4 Sonnet
    return { provider: 'anthropic', model: 'claude-sonnet-4-20250514' };
  }
}

export const enhancedContentGenerationService = EnhancedContentGenerationService;
