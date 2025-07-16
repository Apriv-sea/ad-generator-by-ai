
import { supabase } from '@/integrations/supabase/client';
import { googleSheetsCoreService } from '@/services/core/googleSheetsCore';
import { ColumnMappingService } from '@/services/googlesheets/columnMappingService';

export interface ContentGenerationOptions {
  model: string;
  clientContext: string;
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

      // Appeler l'API de génération avec le bon provider
      const response = await supabase.functions.invoke('llm-generation', {
        body: {
          prompt,
          provider,
          model
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

      // Extraire le contenu de la réponse (response.data contient déjà la réponse de l'API)
      const generatedContent = response.data?.content?.[0]?.text || response.data?.choices?.[0]?.message?.content;
      
      if (!generatedContent) {
        console.error('❌ Pas de contenu généré:', response.data);
        return {
          success: false,
          error: 'Aucun contenu généré par l\'IA'
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
    return `Vous êtes un rédacteur publicitaire hautement qualifié avec une solide expérience en rédaction persuasive, en optimisation des conversions et en techniques de marketing. Vous rédigez des textes convaincants qui touchent les émotions et les besoins du public cible, les incitant à agir ou à acheter. Vous comprenez l'importance de la méthode AIDA (Attention, Intérêt, Désir et Action) et d'autres formules de rédaction éprouvées, que vous intégrez parfaitement dans vos écrits. Vous avez un talent pour créer des titres accrocheurs, des introductions captivantes et des appels à l'action persuasifs. Vous maîtrisez bien la psychologie des consommateurs et utilisez ces connaissances pour créer des messages qui résonnent avec le public cible.


CONTEXTE CLIENT:
${options.clientContext}

CONTEXTE CAMPAGNE:
Campagne: ${options.campaignContext}
Groupe d'annonces: ${options.adGroupContext}
Mots-clés principaux: ${options.keywords.join(', ')}

TÂCHE:
Génère EXACTEMENT 15 titres et 4 descriptions pour Google Ads en respectant ces contraintes:
- Titres: EXACTEMENT 15 titres, maximum 30 caractères chacun
- Descriptions: EXACTEMENT 4 descriptions, maximum 90 caractères chacune
- Inclure les mots-clés naturellement
- Ton persuasif et accrocheur
- Appel à l'action clair

FORMAT DE RÉPONSE (JSON uniquement):
{
  "titles": ["Titre 1", "Titre 2", "Titre 3", "Titre 4", "Titre 5", "Titre 6", "Titre 7", "Titre 8", "Titre 9", "Titre 10", "Titre 11", "Titre 12", "Titre 13", "Titre 14", "Titre 15"],
  "descriptions": ["Description 1", "Description 2", "Description 3", "Description 4"]
}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;
  }

  private static parseGeneratedContent(content: string): {
    success: boolean;
    titles?: string[];
    descriptions?: string[];
    error?: string;
  } {
    try {
      // Nettoyer le contenu pour extraire le JSON
      let cleanContent = content.trim();
      
      // Rechercher le JSON dans le contenu
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }

      // Parser le JSON
      const parsed = JSON.parse(cleanContent);
      
      // Valider la structure
      if (!parsed.titles || !Array.isArray(parsed.titles) || 
          !parsed.descriptions || !Array.isArray(parsed.descriptions)) {
        return {
          success: false,
          error: 'Structure JSON invalide: titles et descriptions requis'
        };
      }

      // Valider les contraintes
      const validTitles = parsed.titles.filter(t => t && t.length <= 30);
      const validDescriptions = parsed.descriptions.filter(d => d && d.length <= 90);

      if (validTitles.length === 0) {
        return {
          success: false,
          error: 'Aucun titre valide généré'
        };
      }

      if (validDescriptions.length === 0) {
        return {
          success: false,
          error: 'Aucune description valide générée'
        };
      }

      return {
        success: true,
        titles: validTitles.slice(0, 15),
        descriptions: validDescriptions.slice(0, 4)
      };

    } catch (error) {
      console.error('Erreur parsing JSON:', error);
      return {
        success: false,
        error: `Erreur parsing JSON: ${error.message}`
      };
    }
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
