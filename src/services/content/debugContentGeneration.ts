import { PromptTemplates } from './promptTemplates';
import { supabase } from '@/integrations/supabase/client';
import { GoogleSheetsService } from '../googlesheets/googleSheetsService';

interface ContentGenerationOptions {
  model: string;
  clientContext: string;
  campaignContext: string;
  adGroupContext: string;
  keywords: string[];
}

export class DebugContentGeneration {
  static async generateAndSaveContent(
    options: ContentGenerationOptions,
    sheetId: string,
    rowIndex: number,
    currentSheetData: string[][]
  ): Promise<{
    success: boolean;
    updatedSheetData?: string[][];
    error?: string;
  }> {
    try {
      console.log('🚨🚨🚨 === DEBUG GENERATION SERVICE APPELÉ ===');
      console.log(`🎯 DEBUG: GENERATION LIGNE ${rowIndex + 1}`);
      console.log('📊 Options:', options);
      console.log('📊 Données feuille:', {
        totalRows: currentSheetData.length,
        headers: currentSheetData[0],
        targetRow: currentSheetData[rowIndex]
      });
      
      // Générer le contenu avec un prompt optimisé
      const prompt = PromptTemplates.buildCompletePrompt({
        adGroupName: options.adGroupContext,
        keywords: options.keywords.join(', '),
        clientContext: options.clientContext,
        campaignContext: options.campaignContext
      });
      
      console.log('📝 Prompt généré:', prompt.substring(0, 200) + '...');
      
      // Appel vers l'edge function
      const { data: llmResponse, error: llmError } = await supabase.functions.invoke('llm-generation', {
        body: {
          prompt,
          model: options.model,
          max_tokens: 2000,
          temperature: 0.7
        }
      });
      
      if (llmError) {
        console.error('❌ Erreur LLM:', llmError);
        return {
          success: false,
          error: `Erreur LLM: ${llmError.message}`
        };
      }
      
      console.log('🔍 Réponse LLM complète:', JSON.stringify(llmResponse, null, 2));
      
      // Extraire le contenu généré
      let generatedContent;
      if (llmResponse?.content?.[0]?.text) {
        generatedContent = llmResponse.content[0].text;
      } else if (llmResponse?.generatedText) {
        generatedContent = llmResponse.generatedText;
      } else {
        console.error('❌ Structure de réponse inattendue:', llmResponse);
        return {
          success: false,
          error: 'Structure de réponse LLM inattendue'
        };
      }
      
      console.log('📄 Contenu généré brut:', generatedContent);
      
      // Parser le JSON
      const parsedContent = this.parseGeneratedContent(generatedContent);
      
      if (!parsedContent.success) {
        console.error('❌ Erreur parsing:', parsedContent.error);
        return {
          success: false,
          error: `Erreur parsing: ${parsedContent.error}`
        };
      }
      
      console.log('✅ Contenu parsé:', {
        titlesCount: parsedContent.titles?.length || 0,
        descriptionsCount: parsedContent.descriptions?.length || 0,
        titles: parsedContent.titles,
        descriptions: parsedContent.descriptions
      });
      
      // Mise à jour de la ligne de données
      const updatedSheetData = [...currentSheetData];
      const originalRow = updatedSheetData[rowIndex] || [];
      const updatedRow = [...originalRow];
      
      // Assurer assez de colonnes (au moins 35)
      while (updatedRow.length < 35) {
        updatedRow.push('');
      }
      
      // Remplir les titres (colonnes 3, 5, 7, 9, ... pour éviter les colonnes "nbcar")
      if (parsedContent.titles) {
        for (let i = 0; i < Math.min(parsedContent.titles.length, 15); i++) {
          const columnIndex = 3 + (i * 2); // 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31
          updatedRow[columnIndex] = parsedContent.titles[i];
          console.log(`✅ Titre ${i + 1} -> Colonne ${columnIndex}: "${parsedContent.titles[i]}"`);
        }
      }
      
      // Remplir les descriptions (après les titres)
      if (parsedContent.descriptions) {
        const descStartCol = 33; // Après les 15 titres et leurs colonnes nbcar
        for (let i = 0; i < Math.min(parsedContent.descriptions.length, 4); i++) {
          const columnIndex = descStartCol + (i * 2); // 33, 35, 37, 39
          updatedRow[columnIndex] = parsedContent.descriptions[i];
          console.log(`✅ Description ${i + 1} -> Colonne ${columnIndex}: "${parsedContent.descriptions[i]}"`);
        }
      }
      
      updatedSheetData[rowIndex] = updatedRow;
      
      console.log('📝 Ligne finale:', {
        originalLength: originalRow.length,
        updatedLength: updatedRow.length,
        titres: updatedRow.slice(3, 18),
        descriptions: updatedRow.slice(33, 41)
      });
      
      // Sauvegarder dans Google Sheets
      console.log('💾 Sauvegarde...');
      const saveResult = await GoogleSheetsService.saveSheetData(sheetId, updatedSheetData);
      
      if (!saveResult) {
        console.error('❌ Erreur sauvegarde');
        return {
          success: false,
          error: 'Erreur sauvegarde Google Sheets'
        };
      }
      
      console.log('✅ DEBUG: GENERATION REUSSIE');
      
      return {
        success: true,
        updatedSheetData
      };
      
    } catch (error) {
      console.error('❌ DEBUG: ERREUR COMPLETE:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }
  
  private static parseGeneratedContent(content: string): {
    success: boolean;
    titles?: string[];
    descriptions?: string[];
    error?: string;
  } {
    try {
      console.log('🔍 Parsing contenu:', content.substring(0, 500));
      
      // Nettoyer le contenu pour extraire le JSON
      let cleanContent = content.trim();
      
      // Rechercher le JSON dans le contenu
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      console.log('🔍 JSON extrait:', cleanContent);
      
      // Parser le JSON
      const parsed = JSON.parse(cleanContent);
      
      console.log('🔍 JSON parsé:', parsed);
      
      // Valider la structure
      if (!parsed.titles || !Array.isArray(parsed.titles)) {
        return {
          success: false,
          error: 'Pas de tableau de titres trouvé'
        };
      }
      
      if (!parsed.descriptions || !Array.isArray(parsed.descriptions)) {
        return {
          success: false,
          error: 'Pas de tableau de descriptions trouvé'
        };
      }
      
      // Valider les contraintes
      const validTitles = parsed.titles.filter((t: any) => t && typeof t === 'string' && t.length <= 30);
      const validDescriptions = parsed.descriptions.filter((d: any) => d && typeof d === 'string' && d.length <= 90);
      
      console.log('🔍 Validation:', {
        titresTotal: parsed.titles.length,
        titresValides: validTitles.length,
        descriptionsTotal: parsed.descriptions.length,
        descriptionsValides: validDescriptions.length
      });
      
      return {
        success: true,
        titles: validTitles,
        descriptions: validDescriptions
      };
      
    } catch (error) {
      console.error('❌ Erreur parsing JSON:', error);
      return {
        success: false,
        error: `Erreur parsing JSON: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }
}