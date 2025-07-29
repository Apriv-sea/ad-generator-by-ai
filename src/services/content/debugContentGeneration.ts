import { PromptTemplates } from './promptTemplates';
import { UnifiedPromptService } from './unifiedPromptService';
import { supabase } from '@/integrations/supabase/client';
import { GoogleSheetsService } from '../googlesheets/googleSheetsService';
import { CampaignContextService } from '../campaign/campaignContextService';

interface ContentGenerationOptions {
  model: string;
  clientContext: string;
  industry?: string;              // Nouveau champ
  targetPersona?: string;         // Nouveau champ
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
        } else if (headerLower.includes('desc')) {
          descriptionColumns.push(index);
          console.log(`    ✅ DESC détectée -> Index ${index}`);
        }
      });
      
      console.log('📊 Structure de colonnes détectée FINALE:', {
        totalColumns: headers.length,
        titleColumns: titleColumns.map(i => `${i}:${headers[i]}`),
        descriptionColumns: descriptionColumns.map(i => `${i}:${headers[i]}`),
        totalTitleColumns: titleColumns.length,
        totalDescriptionColumns: descriptionColumns.length
      });
      
      // Obtenir le contexte dynamique de la campagne pour cette ligne
      const campaignName = currentSheetData[rowIndex][0]; // Colonne A
      const dynamicCampaignContext = CampaignContextService.getContextForCampaign(campaignName);
      
      console.log('🎯 Contexte dynamique:', {
        campaignName,
        dynamicCampaignContext: dynamicCampaignContext.substring(0, 100) + '...',
        originalCampaignContext: options.campaignContext.substring(0, 100) + '...'
      });
      
      // Générer le contenu avec le prompt unifié optimisé
      const prompt = UnifiedPromptService.buildUnifiedPrompt({
        clientContext: options.clientContext,
        industry: options.industry,
        targetPersona: options.targetPersona,
        campaignContext: dynamicCampaignContext || options.campaignContext,
        adGroupContext: options.adGroupContext,
        keywords: options.keywords,
        model: options.model
      });
      
      console.log('📝 Prompt généré:', prompt.substring(0, 200) + '...');
      
      // Appel vers l'edge function sécurisée
      const { data: llmResponse, error: llmError } = await supabase.functions.invoke('secure-llm-api', {
        body: {
          provider: options.model.split(':')[0] || 'openai',
          model: options.model.split(':')[1] || options.model,
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant for generating advertising content.' },
            { role: 'user', content: prompt }
          ],
          maxTokens: 2000,
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
      
      // Parser le JSON avec le service unifié
      const parsedContent = UnifiedPromptService.parseGeneratedContent(generatedContent);
      
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
      const needsMoreDescriptionColumns = descriptionColumns.length < 4; // On veut 4 descriptions
      
      console.log('📊 Besoins identifiés:', {
        titresActuels: titleColumns.length,
        titresNecessaires: 15,
        needsMissingTitleColumns,
        descriptionsActuelles: descriptionColumns.length,
        descriptionsNecessaires: 4,
        needsMoreDescriptionColumns
      });
      
      // ÉTENDRE LA FEUILLE si nécessaire
      if (needsMissingTitleColumns || needsMoreDescriptionColumns) {
        console.log('🚀 EXTENSION DE LA FEUILLE NÉCESSAIRE');
        
        // Créer une copie des headers pour modification
        const extendedHeaders = [...headers];
        
        // Ajouter les colonnes de titre manquantes
        if (needsMissingTitleColumns) {
          const missingTitles = 15 - titleColumns.length;
          console.log(`➕ Ajout de ${missingTitles} colonnes de titre manquantes`);
          
          for (let i = 0; i < missingTitles; i++) {
            const titleNumber = titleColumns.length + i + 1;
            extendedHeaders.push(`Titre ${titleNumber}`);
            extendedHeaders.push(`Nb car Titre ${titleNumber}`);
            titleColumns.push(extendedHeaders.length - 2); // Index du titre (pas du nbcar)
          }
        }
        
        // Ajouter les colonnes de description manquantes
        if (needsMoreDescriptionColumns) {
          const missingDescriptions = 4 - descriptionColumns.length;
          console.log(`➕ Ajout de ${missingDescriptions} colonnes de descriptions (actuelles: ${descriptionColumns.length})`);
          
          for (let i = 0; i < missingDescriptions; i++) {
            const descriptionNumber = descriptionColumns.length + i + 1;
            extendedHeaders.push(`Description ${descriptionNumber}`);
            extendedHeaders.push(`Nb car Desc ${descriptionNumber}`);
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
      
      // Ajouter les formules nbcar pour les colonnes de caractères
      console.log('🚨🚨🚨 DEBUG - Ajout des formules nbcar');
      this.addCharacterCountFormulas(updatedSheetData, rowIndex, titleColumns, descriptionColumns);
      
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
      
      // Supprimer les caractères de contrôle et caractères invisibles
      cleanContent = cleanContent.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      
      // Rechercher le JSON dans le contenu avec plusieurs patterns
      let jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Essayer de trouver un JSON avec des patterns plus flexibles
        jsonMatch = cleanContent.match(/\{[^}]*"titles"[^}]*\}/s);
      }
      
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      // Nettoyer le JSON potentiellement malformé
      cleanContent = this.cleanMalformedJson(cleanContent);
      
      console.log('🔍 JSON extrait et nettoyé:', cleanContent);
      
      // Essayer de parser le JSON
      let parsed;
      try {
        parsed = JSON.parse(cleanContent);
      } catch (firstParseError) {
        console.log('🔧 Première tentative de parsing échouée, essai de correction...');
        
        // Tentative de correction automatique du JSON
        const correctedJson = this.attemptJsonCorrection(cleanContent);
        try {
          parsed = JSON.parse(correctedJson);
          console.log('✅ JSON corrigé avec succès');
        } catch (secondParseError) {
          console.error('❌ Impossible de corriger le JSON:', secondParseError);
          throw firstParseError; // Utiliser l'erreur originale
        }
      }
      
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
      
      // Valider et nettoyer les titres et descriptions
      const validTitles = parsed.titles
        .filter((t: any) => t && typeof t === 'string')
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0 && t.length <= 30);
        
      const validDescriptions = parsed.descriptions
        .filter((d: any) => d && typeof d === 'string')
        .map((d: string) => d.trim())
        .filter((d: string) => d.length >= 65 && d.length <= 90);
      
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

  private static cleanMalformedJson(jsonString: string): string {
    // Supprimer les retours à la ligne indésirables dans les valeurs de chaînes
    let cleaned = jsonString;
    
    // Corriger les guillemets manquants ou malformés
    cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // Supprimer les virgules en trop
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    // Ajouter des virgules manquantes entre les éléments d'array
    cleaned = cleaned.replace(/"\s*\n\s*"/g, '", "');
    
    return cleaned;
  }

  private static attemptJsonCorrection(jsonString: string): string {
    let corrected = jsonString;
    
    // Essayer de fermer les accolades manquantes
    const openBraces = (corrected.match(/\{/g) || []).length;
    const closeBraces = (corrected.match(/\}/g) || []).length;
    
    if (openBraces > closeBraces) {
      corrected += '}';
    }
    
    // Essayer de fermer les crochets manquants
    const openBrackets = (corrected.match(/\[/g) || []).length;
    const closeBrackets = (corrected.match(/\]/g) || []).length;
    
    if (openBrackets > closeBrackets) {
      corrected += ']';
    }
    
    return corrected;
  }

  private static addCharacterCountFormulas(
    sheetData: string[][],
    rowIndex: number,
    titleColumns: number[],
    descriptionColumns: number[]
  ): void {
    console.log('🔧 Ajout des formules NBCAR');
    console.log('📊 Données pour formules:', {
      rowIndex,
      titleColumns,
      descriptionColumns,
      headers: sheetData[0]
    });
    
    const headers = sheetData[0];
    const row = sheetData[rowIndex];
    
    // Pour chaque colonne titre, ajouter automatiquement la formule NBCAR dans la colonne juste à droite
    titleColumns.forEach((titleColumnIndex, i) => {
      const titleHeader = headers[titleColumnIndex];
      const nextColumnIndex = titleColumnIndex + 1;
      
      console.log(`🎯 Traitement titre ${i + 1}: "${titleHeader}" (index ${titleColumnIndex})`);
      console.log(`🔍 Ajout formule NBCAR dans colonne ${nextColumnIndex}: "${headers[nextColumnIndex]}"`);
      
      if (nextColumnIndex < headers.length) {
        const columnLetter = this.numberToColumnLetter(titleColumnIndex + 1); // +1 car Excel commence à 1
        const formula = `=NBCAR(${columnLetter}${rowIndex + 1})`;
        
        // Étendre la ligne si nécessaire
        while (row.length <= nextColumnIndex) {
          row.push('');
        }
        
        row[nextColumnIndex] = formula;
        console.log(`✅ Formule NBCAR ajoutée pour titre ${i + 1}: ${formula} -> colonne ${nextColumnIndex} (${headers[nextColumnIndex]})`);
      } else {
        console.log(`❌ Pas de colonne suivante après titre ${i + 1}`);
      }
    });

    // Pour chaque colonne description, ajouter automatiquement la formule NBCAR dans la colonne juste à droite
    descriptionColumns.forEach((descColumnIndex, i) => {
      const descHeader = headers[descColumnIndex];
      const nextColumnIndex = descColumnIndex + 1;
      
      console.log(`🎯 Traitement description ${i + 1}: "${descHeader}" (index ${descColumnIndex})`);
      console.log(`🔍 Ajout formule NBCAR dans colonne ${nextColumnIndex}: "${headers[nextColumnIndex]}"`);
      
      if (nextColumnIndex < headers.length) {
        const columnLetter = this.numberToColumnLetter(descColumnIndex + 1); // +1 car Excel commence à 1
        const formula = `=NBCAR(${columnLetter}${rowIndex + 1})`;
        
        // Étendre la ligne si nécessaire
        while (row.length <= nextColumnIndex) {
          row.push('');
        }
        
        row[nextColumnIndex] = formula;
        console.log(`✅ Formule NBCAR ajoutée pour description ${i + 1}: ${formula} -> colonne ${nextColumnIndex} (${headers[nextColumnIndex]})`);
      } else {
        console.log(`❌ Pas de colonne suivante après description ${i + 1}`);
      }
    });
    
    console.log('🔧 Fin ajout formules NBCAR');
  }

  private static numberToColumnLetter(columnNumber: number): string {
    let result = '';
    let num = columnNumber - 1; // Convertir en base 0 pour le calcul
    
    while (num >= 0) {
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26) - 1;
    }
    
    return result;
  }
}