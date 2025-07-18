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
      console.log('📊 Données feuille complètes:', {
        totalRows: currentSheetData.length,
        headers: currentSheetData[0],
        headersCount: currentSheetData[0]?.length || 0,
        targetRow: currentSheetData[rowIndex],
        targetRowLength: currentSheetData[rowIndex]?.length || 0
      });
      
      // Analyser la structure des colonnes pour identifier titres et descriptions
      const headers = currentSheetData[0] || [];
      const titleColumns: number[] = [];
      const descriptionColumns: number[] = [];
      
      console.log('🔍 ANALYSE DES HEADERS - Détail par colonne:');
      headers.forEach((header, index) => {
        const headerLower = String(header).toLowerCase();
        console.log(`  Colonne ${index}: "${header}" (${headerLower})`);
        
        if (headerLower.includes('titre') || headerLower.includes('headline')) {
          titleColumns.push(index);
          console.log(`    ✅ TITRE détecté -> Index ${index}`);
        } else if (headerLower.includes('description')) {
          descriptionColumns.push(index);
          console.log(`    ✅ DESCRIPTION détectée -> Index ${index}`);
        }
      });
      
      console.log('📊 Structure de colonnes détectée FINALE:', {
        totalColumns: headers.length,
        titleColumns: titleColumns.map(i => `${i}:${headers[i]}`),
        descriptionColumns: descriptionColumns.map(i => `${i}:${headers[i]}`),
        totalTitleColumns: titleColumns.length,
        totalDescriptionColumns: descriptionColumns.length
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
      
      // ======= ANALYSE ET EXTENSION DE LA FEUILLE =======
      console.log('🔧 ANALYSE DES BESOINS DE COLONNES');
      
      // Vérifier si on a besoin d'étendre la feuille
      const needsMissingTitleColumns = titleColumns.length < 15; // On veut 15 titres
      const needsDescriptionColumns = descriptionColumns.length === 0; // On veut 4 descriptions
      
      console.log('📊 Besoins identifiés:', {
        titresActuels: titleColumns.length,
        titresNecessaires: 15,
        needsMissingTitleColumns,
        descriptionsActuelles: descriptionColumns.length,
        descriptionsNecessaires: 4,
        needsDescriptionColumns
      });
      
      // ÉTENDRE LA FEUILLE si nécessaire
      if (needsMissingTitleColumns || needsDescriptionColumns) {
        console.log('🚀 EXTENSION DE LA FEUILLE NÉCESSAIRE');
        
        // Créer une copie des headers pour modification
        const extendedHeaders = [...headers];
        
        // Ajouter les colonnes de titre manquantes
        if (needsMissingTitleColumns) {
          const missingTitles = 15 - titleColumns.length;
          console.log(`➕ Ajout de ${missingTitles} colonnes de titre manquantes`);
          
          for (let i = 0; i < missingTitles; i++) {
            const titleNumber = titleColumns.length + i + 1;
            extendedHeaders.push(`Headline ${titleNumber}`);
            extendedHeaders.push('nbcar');
            titleColumns.push(extendedHeaders.length - 2); // Index du titre (pas du nbcar)
          }
        }
        
        // Ajouter les colonnes de description
        if (needsDescriptionColumns) {
          console.log('➕ Ajout de 4 colonnes de descriptions');
          for (let i = 1; i <= 4; i++) {
            extendedHeaders.push(`Description ${i}`);
            extendedHeaders.push('nbcar');
            descriptionColumns.push(extendedHeaders.length - 2); // Index de la description (pas du nbcar)
          }
        }
        
        // Mettre à jour les headers dans les données
        currentSheetData[0] = extendedHeaders;
        
        console.log('✅ Feuille étendue:', {
          anciensHeaders: headers.length,
          nouveauxHeaders: extendedHeaders.length,
          nouveauxTitles: titleColumns.length,
          nouvellesDescriptions: descriptionColumns.length
        });
      }
      
      // Mise à jour de la ligne de données
      const updatedSheetData = [...currentSheetData];
      const originalRow = updatedSheetData[rowIndex] || [];
      const updatedRow = [...originalRow];
      
      // Étendre la ligne aux nouvelles colonnes
      const totalColumns = currentSheetData[0].length;
      while (updatedRow.length < totalColumns) {
        updatedRow.push('');
      }
      
      console.log(`📏 Ligne adaptée à ${updatedRow.length} colonnes (total: ${totalColumns})`);
      
      // Remplir UNIQUEMENT les colonnes de titres détectées
      console.log('🎯 DÉBUT MAPPING TITRES');
      console.log('📊 Données pour mapping:', {
        titresDisponibles: parsedContent.titles?.length || 0,
        colonnesTitresDetectees: titleColumns.length,
        titres: parsedContent.titles,
        colonnesTitres: titleColumns
      });
      
      if (parsedContent.titles && titleColumns.length > 0) {
        const maxTitles = Math.min(parsedContent.titles.length, titleColumns.length);
        console.log(`🔢 Mapping ${maxTitles} titres (min entre ${parsedContent.titles.length} titres et ${titleColumns.length} colonnes)`);
        
        for (let i = 0; i < maxTitles; i++) {
          const columnIndex = titleColumns[i];
          console.log(`🎯 Tentative mapping titre ${i + 1}:`);
          console.log(`  - Titre: "${parsedContent.titles[i]}"`);
          console.log(`  - Index colonne: ${columnIndex}`);
          console.log(`  - Nom colonne: "${currentSheetData[0][columnIndex]}"`);
          console.log(`  - Taille ligne: ${updatedRow.length}`);
          
          if (columnIndex < updatedRow.length) {
            updatedRow[columnIndex] = parsedContent.titles[i];
            console.log(`  ✅ SUCCÈS: Titre ${i + 1} -> Colonne ${columnIndex} (${currentSheetData[0][columnIndex]}): "${parsedContent.titles[i]}"`);
          } else {
            console.log(`  ❌ ÉCHEC: columnIndex ${columnIndex} >= updatedRow.length ${updatedRow.length}`);
          }
        }
      } else {
        console.log('❌ Pas de titres à mapper:', {
          hasTitles: !!parsedContent.titles,
          titlesLength: parsedContent.titles?.length || 0,
          titleColumnsLength: titleColumns.length
        });
      }
      
      // Remplir les colonnes de descriptions (nouvellement créées ou existantes)
      if (parsedContent.descriptions && descriptionColumns.length > 0) {
        const maxDescriptions = Math.min(parsedContent.descriptions.length, descriptionColumns.length);
        
        for (let i = 0; i < maxDescriptions; i++) {
          const columnIndex = descriptionColumns[i];
          if (columnIndex < updatedRow.length) {
            updatedRow[columnIndex] = parsedContent.descriptions[i];
            console.log(`✅ Description ${i + 1} -> Colonne ${columnIndex} (${currentSheetData[0][columnIndex]}): "${parsedContent.descriptions[i]}"`);
          }
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