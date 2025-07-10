
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
    mappings: {
      campaignColumn: number;
      adGroupColumn: number;
      keywordsColumn: number;
      title1Column: number;
      title2Column: number;
      title3Column: number;
      description1Column: number;
      description2Column: number;
    };
    isValid: boolean;
    errors: string[];
  }> {
    try {
      const sheetData = await GoogleSheetsService.getSheetData(sheetId);
      const headers = sheetData.values?.[0] || [];
      
      console.log('🔍 Analyse structure feuille:', headers);
      
      const mappings = {
        campaignColumn: this.findColumnIndex(headers, [
          'campagne', 'campaign', 'nom de la campagne', 'campaign name', 'campagnes'
        ]),
        adGroupColumn: this.findColumnIndex(headers, [
          'groupe d\'annonces', 'ad group', 'groupe annonces', 'adgroup', 'groupe', 'nom du groupe d\'annonces'
        ]),
        keywordsColumn: this.findColumnIndex(headers, [
          'mots-clés', 'keywords', 'mots clés', 'top 3 mots-clés', 'keyword', 'mots clés (séparés par des virgules)', 'top 3 mots-clés (séparés par des virgules)'
        ]),
        title1Column: this.findColumnIndex(headers, [
          'titre 1', 'title 1', 'headline 1', 'h1', 'premier titre', 'headline'
        ]),
        title2Column: this.findColumnIndex(headers, [
          'titre 2', 'title 2', 'headline 2', 'h2', 'deuxième titre'
        ]),
        title3Column: this.findColumnIndex(headers, [
          'titre 3', 'title 3', 'headline 3', 'h3', 'troisième titre'
        ]),
        description1Column: this.findColumnIndex(headers, [
          'description 1', 'desc 1', 'description', 'première description', 'headline 4'
        ]),
        description2Column: this.findColumnIndex(headers, [
          'description 2', 'desc 2', 'deuxième description', 'headline 5'
        ])
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
          description1Column: -1,
          description2Column: -1
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
    
    // Assurer que le tableau a assez d'éléments
    const maxColumnIndex = Math.max(
      mappings.title1Column,
      mappings.title2Column,
      mappings.title3Column,
      mappings.description1Column,
      mappings.description2Column
    );
    
    while (updatedRow.length <= maxColumnIndex) {
      updatedRow.push('');
    }
    
    // Appliquer les titres
    if (titles.length > 0 && mappings.title1Column !== -1) {
      updatedRow[mappings.title1Column] = titles[0];
      console.log(`✅ Titre 1 ajouté en colonne ${mappings.title1Column}: "${titles[0]}"`);
    }
    if (titles.length > 1 && mappings.title2Column !== -1) {
      updatedRow[mappings.title2Column] = titles[1];
      console.log(`✅ Titre 2 ajouté en colonne ${mappings.title2Column}: "${titles[1]}"`);
    }
    if (titles.length > 2 && mappings.title3Column !== -1) {
      updatedRow[mappings.title3Column] = titles[2];
      console.log(`✅ Titre 3 ajouté en colonne ${mappings.title3Column}: "${titles[2]}"`);
    }
    
    // Appliquer les descriptions
    if (descriptions.length > 0 && mappings.description1Column !== -1) {
      updatedRow[mappings.description1Column] = descriptions[0];
      console.log(`✅ Description 1 ajoutée en colonne ${mappings.description1Column}: "${descriptions[0]}"`);
    }
    if (descriptions.length > 1 && mappings.description2Column !== -1) {
      updatedRow[mappings.description2Column] = descriptions[1];
      console.log(`✅ Description 2 ajoutée en colonne ${mappings.description2Column}: "${descriptions[1]}"`);
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
      'Titre 1',
      'Titre 2',
      'Titre 3',
      'Description 1',
      'Description 2',
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
