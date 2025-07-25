
import { GoogleSheetsService } from "../googlesheets/googleSheetsService";

/**
 * Service pour le mapping dynamique des colonnes Google Sheets
 */
export class ColumnMappingService {
  /**
   * Détecter et mapper automatiquement les colonnes importantes
   */
  static async analyzeSheetStructure(sheetId: string): Promise<{
    headers: string[];
    mappings: any;
    isValid: boolean;
    errors: string[];
  }> {
    try {
      const sheetData = await GoogleSheetsService.getSheetData(sheetId);
      const headers = sheetData.values?.[0] || [];
      
      console.log('🔍 Analyse structure feuille:', headers);
      
      const mappings = {
        campaignColumn: this.findColumnIndex(headers, [
          'campagnes', 'campagne', 'campaign', 'nom de la campagne', 'campaign name'
        ]),
        adGroupColumn: this.findColumnIndex(headers, [
          'groupes d\'annonces', 'groupe d\'annonces', 'ad group', 'groupe annonces', 'adgroup', 'groupe', 'nom du groupe d\'annonces'
        ]),
        keywordsColumn: this.findColumnIndex(headers, [
          'top mots clés', 'mots-clés', 'keywords', 'mots clés', 'top 3 mots-clés', 'keyword', 'mots clés (séparés par des virgules)', 'top 3 mots-clés (séparés par des virgules)'
        ]),
        // Titres 1-15
        title1Column: this.findColumnIndex(headers, ['headline 1', 'titre 1', 'title 1', 'h1']),
        title2Column: this.findColumnIndex(headers, ['headline 2', 'titre 2', 'title 2', 'h2']),
        title3Column: this.findColumnIndex(headers, ['headline 3', 'titre 3', 'title 3', 'h3']),
        title4Column: this.findColumnIndex(headers, ['headline 4', 'titre 4', 'title 4', 'h4']),
        title5Column: this.findColumnIndex(headers, ['headline 5', 'titre 5', 'title 5', 'h5']),
        title6Column: this.findColumnIndex(headers, ['headline 6', 'titre 6', 'title 6', 'h6']),
        title7Column: this.findColumnIndex(headers, ['headline 7', 'titre 7', 'title 7', 'h7']),
        title8Column: this.findColumnIndex(headers, ['headline 8', 'titre 8', 'title 8', 'h8']),
        title9Column: this.findColumnIndex(headers, ['headline 9', 'titre 9', 'title 9', 'h9']),
        title10Column: this.findColumnIndex(headers, ['headline 10', 'titre 10', 'title 10', 'h10']),
        title11Column: this.findColumnIndex(headers, ['headline 11', 'titre 11', 'title 11', 'h11']),
        title12Column: this.findColumnIndex(headers, ['headline 12', 'titre 12', 'title 12', 'h12']),
        title13Column: this.findColumnIndex(headers, ['headline 13', 'titre 13', 'title 13', 'h13', 'Titre 13']),
        title14Column: this.findColumnIndex(headers, ['headline 14', 'titre 14', 'title 14', 'h14', 'Titre 14']),
        title15Column: this.findColumnIndex(headers, ['headline 15', 'titre 15', 'title 15', 'h15', 'Titre 15']),
        // Descriptions
        description1Column: this.findColumnIndex(headers, ['description 1', 'desc 1', 'description', 'Description 1']),
        description2Column: this.findColumnIndex(headers, ['description 2', 'desc 2', 'Description 2']),
        description3Column: this.findColumnIndex(headers, ['description 3', 'desc 3', 'Description 3']),
        description4Column: this.findColumnIndex(headers, ['description 4', 'desc 4', 'Description 4'])
      };
      
      const errors: string[] = [];
      let isValid = true;
      
      // Vérifier les colonnes essentielles
      if (mappings.campaignColumn === -1) {
        errors.push('Colonne "Campagne" non trouvée');
        isValid = false;
      }
      if (mappings.adGroupColumn === -1) {
        errors.push('Colonne "Groupe d\'annonces" non trouvée');
        isValid = false;
      }
      if (mappings.keywordsColumn === -1) {
        errors.push('Colonne "Mots-clés" non trouvée');
        isValid = false;
      }
      
      // Vérifier les colonnes de sortie
      if (mappings.title1Column === -1) {
        errors.push('Colonne "Titre 1" non trouvée - impossible d\'écrire les résultats');
      }
      if (mappings.description1Column === -1) {
        errors.push('Colonne "Description 1" non trouvée - impossible d\'écrire les résultats');
      }
      
      console.log('📊 Résultat mapping:', { mappings, isValid, errors });
      
      return {
        headers,
        mappings,
        isValid,
        errors
      };
      
    } catch (error) {
      console.error('❌ Erreur analyse structure:', error);
      return {
        headers: [],
        mappings: {
          campaignColumn: -1,
          adGroupColumn: -1,
          keywordsColumn: -1,
          title1Column: -1,
          title2Column: -1,
          title3Column: -1,
          title4Column: -1,
          title5Column: -1,
          title6Column: -1,
          title7Column: -1,
          title8Column: -1,
          title9Column: -1,
          title10Column: -1,
          title11Column: -1,
          title12Column: -1,
          title13Column: -1,
          title14Column: -1,
          title15Column: -1,
          description1Column: -1,
          description2Column: -1,
          description3Column: -1,
          description4Column: -1
        },
        isValid: false,
        errors: [`Erreur d'analyse: ${error.message}`]
      };
    }
  }
  
  /**
   * Appliquer les résultats de génération aux bonnes colonnes
   */
  static applyGenerationResults(
    originalRow: string[],
    titles: string[],
    descriptions: string[],
    mappings: any
  ): string[] {
    const updatedRow = [...originalRow];
    
    console.log('📝 Application résultats génération:', {
      originalRow: originalRow.slice(0, 10),
      titles,
      descriptions,
      mappings
    });
    
    // Assurer que le tableau a assez d'éléments - chercher le max de tous les indices
    const allColumnIndices = Object.values(mappings).filter(index => typeof index === 'number' && index !== -1) as number[];
    const maxColumnIndex = allColumnIndices.length > 0 ? Math.max(...allColumnIndices) : 0;
    
    while (updatedRow.length <= maxColumnIndex) {
      updatedRow.push('');
    }
    
    // Appliquer les titres (jusqu'à 15) - SEULEMENT si ce ne sont pas des formules
    for (let i = 0; i < Math.min(titles.length, 15); i++) {
      const titleColumnKey = `title${i + 1}Column`;
      console.log(`🔍 Recherche ${titleColumnKey}, valeur mapping: ${mappings[titleColumnKey]}`);
      if (mappings[titleColumnKey] !== -1) {
        // Vérifier si la cellule contient une formule (commence par =)
        const existingValue = updatedRow[mappings[titleColumnKey]];
        if (!existingValue || !existingValue.toString().startsWith('=')) {
          updatedRow[mappings[titleColumnKey]] = titles[i];
          console.log(`✅ Titre ${i + 1} ajouté en colonne ${mappings[titleColumnKey]}: "${titles[i]}"`);
        } else {
          console.log(`⚠️ Titre ${i + 1} ignoré - formule existante en colonne ${mappings[titleColumnKey]}: "${existingValue}"`);
        }
      } else {
        console.log(`❌ Titre ${i + 1} - Colonne non trouvée (${titleColumnKey})`);
      }
    }
    
    // Appliquer les descriptions (jusqu'à 4) - SEULEMENT si ce ne sont pas des formules
    for (let i = 0; i < Math.min(descriptions.length, 4); i++) {
      const descriptionColumnKey = `description${i + 1}Column`;
      console.log(`🔍 Recherche ${descriptionColumnKey}, valeur mapping: ${mappings[descriptionColumnKey]}`);
      if (mappings[descriptionColumnKey] !== -1) {
        // Vérifier si la cellule contient une formule (commence par =)
        const existingValue = updatedRow[mappings[descriptionColumnKey]];
        if (!existingValue || !existingValue.toString().startsWith('=')) {
          updatedRow[mappings[descriptionColumnKey]] = descriptions[i];
          console.log(`✅ Description ${i + 1} ajoutée en colonne ${mappings[descriptionColumnKey]}: "${descriptions[i]}"`);
        } else {
          console.log(`⚠️ Description ${i + 1} ignorée - formule existante en colonne ${mappings[descriptionColumnKey]}: "${existingValue}"`);
        }
      } else {
        console.log(`❌ Description ${i + 1} - Colonne non trouvée (${descriptionColumnKey})`);
      }
    }
    
    console.log('📝 Ligne finale après application:', updatedRow.slice(0, 15));
    
    return updatedRow;
  }
  
  /**
   * Trouver l'index d'une colonne en cherchant dans plusieurs variantes
   */
  private static findColumnIndex(headers: string[], variants: string[]): number {
    if (!headers || headers.length === 0) return -1;
    
    for (const variant of variants) {
      const index = headers.findIndex(header => 
        header?.toLowerCase().trim().includes(variant.toLowerCase())
      );
      if (index !== -1) {
        console.log(`✅ Colonne trouvée: "${variant}" -> index ${index} (${headers[index]})`);
        return index;
      }
    }
    
    console.log(`❌ Aucune colonne trouvée pour: ${variants.join(', ')}`);
    return -1;
  }
  
  /**
   * Créer une feuille avec les en-têtes standard
   */
  static getStandardHeaders(): string[] {
    return [
      'Nom de la campagne',
      'Nom du groupe d\'annonces',
      'Top 3 mots-clés (séparés par des virgules)',
      'État du groupe d\'annonces',
      'Type de correspondance par défaut',
      'Titre 1', 'Titre 2', 'Titre 3', 'Titre 4', 'Titre 5',
      'Titre 6', 'Titre 7', 'Titre 8', 'Titre 9', 'Titre 10',
      'Titre 11', 'Titre 12', 'Titre 13', 'Titre 14', 'Titre 15',
      'Description 1', 'Description 2', 'Description 3', 'Description 4',
      'URL finale',
      'Chemin d\'affichage 1',
      'Chemin d\'affichage 2',
      'Mots-clés ciblés',
      'Mots-clés négatifs',
      'Audience ciblée',
      'Extensions d\'annonces'
    ];
  }
}
