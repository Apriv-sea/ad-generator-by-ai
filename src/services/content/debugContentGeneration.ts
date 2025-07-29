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
      
      console.log('✅ Contenu parsé initial:', {
        titlesCount: parsedContent.titles?.length || 0,
        descriptionsCount: parsedContent.descriptions?.length || 0,
        titles: parsedContent.titles,
        descriptions: parsedContent.descriptions
      });

      // ======= LOGIQUE DE RETRY POUR DESCRIPTIONS MANQUANTES =======
      let finalDescriptions = parsedContent.descriptions || [];
      let retryCount = 0;
      const MAX_RETRIES = 2; // LIMITE DE SÉCURITÉ
      
      // Boucle de retry avec limite de sécurité
      while (finalDescriptions.length < 4 && retryCount < MAX_RETRIES) {
        const missingDescriptions = 4 - finalDescriptions.length;
        retryCount++;
        
        console.log(`🔄 RETRY ${retryCount}/${MAX_RETRIES}: Il manque ${missingDescriptions} descriptions valides, appel API supplémentaire...`);
        
        const retryResult = await this.retryMissingDescriptions(
          options,
          missingDescriptions,
          finalDescriptions,
          retryCount
        );
        
        if (retryResult.success && retryResult.descriptions) {
          finalDescriptions = [...finalDescriptions, ...retryResult.descriptions];
          console.log(`✅ RETRY ${retryCount} RÉUSSI: ${retryResult.descriptions.length} descriptions ajoutées (total: ${finalDescriptions.length})`);
          
          // Si on a maintenant 4 descriptions, on peut arrêter
          if (finalDescriptions.length >= 4) {
            console.log(`🎯 OBJECTIF ATTEINT: 4 descriptions obtenues après ${retryCount} retry(s)`);
            break;
          }
        } else {
          console.log(`⚠️ RETRY ${retryCount} ÉCHOUÉ: ${retryResult.error || 'Erreur inconnue'}`);
        }
      }
      
      // Log final du statut
      if (finalDescriptions.length < 4 && retryCount >= MAX_RETRIES) {
        console.log(`⚠️ LIMITE DE RETRY ATTEINTE: ${finalDescriptions.length}/4 descriptions après ${MAX_RETRIES} tentatives`);
      }
      
      console.log('📊 Descriptions finales:', {
        count: finalDescriptions.length,
        retryCount,
        descriptions: finalDescriptions
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
        
        // Ajouter les colonnes de titre manquantes (sans les colonnes NBCAR)
        if (needsMissingTitleColumns) {
          const missingTitles = 15 - titleColumns.length;
          console.log(`➕ Ajout de ${missingTitles} colonnes de titre manquantes (sans comptage de caractères)`);
          
          for (let i = 0; i < missingTitles; i++) {
            const titleNumber = titleColumns.length + i + 1;
            extendedHeaders.push(`Titre ${titleNumber}`);
            titleColumns.push(extendedHeaders.length - 1); // Index du titre
          }
        }
        
        // Ajouter les colonnes de description manquantes (sans les colonnes NBCAR)
        if (needsMoreDescriptionColumns) {
          const missingDescriptions = 4 - descriptionColumns.length;
          console.log(`➕ Ajout de ${missingDescriptions} colonnes de descriptions (actuelles: ${descriptionColumns.length}, sans comptage)`);
          
          for (let i = 0; i < missingDescriptions; i++) {
            const descriptionNumber = descriptionColumns.length + i + 1;
            extendedHeaders.push(`Description ${descriptionNumber}`);
            descriptionColumns.push(extendedHeaders.length - 1); // Index de la description
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
      
      // Remplir UNIQUEMENT les colonnes de titres détectées (en évitant les colonnes protégées)
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
          
          // Vérifier si la colonne est protégée
          if (this.isColumnProtected(columnIndex)) {
            console.log(`🔒 SKIP: Titre ${i + 1} - Colonne ${columnIndex} protégée`);
            continue;
          }
          
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
      
      // Remplir les colonnes de descriptions (en évitant les colonnes protégées)
      if (finalDescriptions && descriptionColumns.length > 0) {
        const maxDescriptions = Math.min(finalDescriptions.length, descriptionColumns.length);
        
        for (let i = 0; i < maxDescriptions; i++) {
          const columnIndex = descriptionColumns[i];
          
          // Vérifier si la colonne est protégée
          if (this.isColumnProtected(columnIndex)) {
            console.log(`🔒 SKIP: Description ${i + 1} - Colonne ${columnIndex} protégée`);
            continue;
          }
          
          if (columnIndex < updatedRow.length) {
            updatedRow[columnIndex] = finalDescriptions[i];
            console.log(`✅ Description ${i + 1} -> Colonne ${columnIndex} (${currentSheetData[0][columnIndex]}): "${finalDescriptions[i]}"`);
          }
        }
      }
      
      updatedSheetData[rowIndex] = updatedRow;
      
      // Les formules de comptage de caractères sont maintenant gérées manuellement par l'utilisateur
      console.log('ℹ️ Comptage de caractères désactivé - géré manuellement par l\'utilisateur');
      
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
        .filter((d: string) => d.length >= 55 && d.length <= 90);
      
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

  // ======= COLONNES PROTÉGÉES - NE PAS ÉCRIRE =======
  private static readonly PROTECTED_COLUMNS = ['E', 'G', 'I', 'K', 'M', 'O', 'Q', 'S', 'U', 'W', 'Y', 'AA', 'AC', 'AE', 'AG'];
  
  private static isColumnProtected(columnIndex: number): boolean {
    const columnLetter = this.numberToColumnLetter(columnIndex + 1);
    const isProtected = this.PROTECTED_COLUMNS.includes(columnLetter);
    if (isProtected) {
      console.log(`🔒 Colonne ${columnLetter} (index ${columnIndex}) protégée - pas d'écriture`);
    }
    return isProtected;
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

  // ======= MÉTHODE DE RETRY POUR DESCRIPTIONS MANQUANTES =======
  private static async retryMissingDescriptions(
    options: ContentGenerationOptions,
    missingCount: number,
    existingDescriptions: string[],
    retryAttempt: number
  ): Promise<{
    success: boolean;
    descriptions?: string[];
    error?: string;
  }> {
    try {
      console.log(`🔄 RETRY ${retryAttempt}/2: Génération de ${missingCount} descriptions supplémentaires`);
      
      // Créer un prompt spécialisé pour les descriptions uniquement
      const retryPrompt = this.buildDescriptionRetryPrompt(options, missingCount, existingDescriptions, retryAttempt);
      
      console.log(`📝 Prompt retry ${retryAttempt}:`, retryPrompt.substring(0, 300) + '...');
      
      // Appel vers l'edge function avec le prompt spécialisé
      const { data: llmResponse, error: llmError } = await supabase.functions.invoke('secure-llm-api', {
        body: {
          provider: options.model.split(':')[0] || 'anthropic',
          model: options.model.split(':')[1] || 'claude-sonnet-4-20250514',
          messages: [
            { role: 'system', content: 'You are a specialized copywriter focused on creating perfect ad descriptions.' },
            { role: 'user', content: retryPrompt }
          ],
          maxTokens: 1000,
          temperature: 0.7
        }
      });
      
      if (llmError) {
        console.error('❌ Erreur LLM retry:', llmError);
        return {
          success: false,
          error: `Erreur LLM retry: ${llmError.message}`
        };
      }
      
      // Extraire le contenu généré (même logique que dans la méthode principale)
      let generatedContent;
      if (llmResponse?.content?.[0]?.text) {
        generatedContent = llmResponse.content[0].text;
      } else if (llmResponse?.generatedText) {
        generatedContent = llmResponse.generatedText;
      } else {
        console.error('❌ Structure de réponse retry inattendue:', llmResponse);
        return {
          success: false,
          error: 'Structure de réponse LLM retry inattendue'
        };
      }
      
      console.log('📄 Contenu retry généré:', generatedContent);
      
      // Parser spécialement pour les descriptions
      const parsedDescriptions = this.parseDescriptionsOnly(generatedContent);
      
      if (!parsedDescriptions.success) {
        return {
          success: false,
          error: parsedDescriptions.error
        };
      }
      
      return {
        success: true,
        descriptions: parsedDescriptions.descriptions
      };
      
    } catch (error) {
      console.error('❌ Erreur retry descriptions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur retry inconnue'
      };
    }
  }

  private static buildDescriptionRetryPrompt(
    options: ContentGenerationOptions,
    missingCount: number,
    existingDescriptions: string[],
    retryAttempt: number
  ): string {
    return `GÉNÉRATION SPÉCIALISÉE DE DESCRIPTIONS PUBLICITAIRES - TENTATIVE ${retryAttempt}/2

CONTEXTE CLIENT:
${options.clientContext}

${options.industry ? `SECTEUR: ${options.industry}` : ''}
${options.targetPersona ? `CIBLE: ${options.targetPersona}` : ''}

CONTEXTE CAMPAGNE:
${options.campaignContext}

GROUPE D'ANNONCES:
${options.adGroupContext}

MOTS-CLÉS PRINCIPAUX: ${options.keywords.join(', ')}

DESCRIPTIONS DÉJÀ GÉNÉRÉES:
${existingDescriptions.map((desc, i) => `${i + 1}. ${desc}`).join('\n')}

MISSION: Générer EXACTEMENT ${missingCount} descriptions publicitaires complémentaires.
${retryAttempt > 1 ? `⚠️ TENTATIVE ${retryAttempt}/2 - Soyez plus créatif et varié dans vos approches !` : ''}

CONTRAINTES STRICTES:
✅ Chaque description doit faire MINIMUM 55 caractères et MAXIMUM 90 caractères
✅ Inclure naturellement les mots-clés
✅ Être différente des descriptions déjà générées
✅ Respecter le ton et le positionnement du client
✅ Être persuasive et inciter à l'action

FORMAT DE RÉPONSE OBLIGATOIRE (JSON uniquement):
{
  "descriptions": [
    "Description 1 de ${missingCount} requises (55-90 caractères)",
    "Description 2 de ${missingCount} requises (55-90 caractères)"${missingCount > 2 ? ',' : ''}
    ${missingCount > 2 ? `"Description 3 de ${missingCount} requises (55-90 caractères)"${missingCount > 3 ? ',' : ''}` : ''}
    ${missingCount > 3 ? `"Description 4 de ${missingCount} requises (55-90 caractères)"` : ''}
  ]
}

IMPORTANT: Retourner UNIQUEMENT le JSON, rien d'autre.`;
  }

  private static parseDescriptionsOnly(content: string): {
    success: boolean;
    descriptions?: string[];
    error?: string;
  } {
    try {
      console.log('🔍 Parsing retry descriptions:', content.substring(0, 500));
      
      // Nettoyer et extraire le JSON (même logique que parseGeneratedContent)
      let cleanContent = content.trim();
      cleanContent = cleanContent.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      
      let jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        jsonMatch = cleanContent.match(/\{[^}]*"descriptions"[^}]*\}/s);
      }
      
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      cleanContent = this.cleanMalformedJson(cleanContent);
      
      console.log('🔍 JSON retry extrait:', cleanContent);
      
      let parsed;
      try {
        parsed = JSON.parse(cleanContent);
      } catch (firstParseError) {
        const correctedJson = this.attemptJsonCorrection(cleanContent);
        try {
          parsed = JSON.parse(correctedJson);
        } catch (secondParseError) {
          throw firstParseError;
        }
      }
      
      if (!parsed.descriptions || !Array.isArray(parsed.descriptions)) {
        return {
          success: false,
          error: 'Pas de tableau de descriptions trouvé dans la réponse retry'
        };
      }
      
      // Valider et nettoyer les descriptions
      const validDescriptions = parsed.descriptions
        .filter((d: any) => d && typeof d === 'string')
        .map((d: string) => d.trim())
        .filter((d: string) => d.length >= 55 && d.length <= 90);
      
      console.log('✅ Descriptions retry validées:', {
        total: parsed.descriptions.length,
        valides: validDescriptions.length,
        descriptions: validDescriptions
      });
      
      return {
        success: true,
        descriptions: validDescriptions
      };
      
    } catch (error) {
      console.error('❌ Erreur parsing descriptions retry:', error);
      return {
        success: false,
        error: `Erreur parsing descriptions retry: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }
}