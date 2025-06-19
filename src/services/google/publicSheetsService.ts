
/**
 * Service pour lire les Google Sheets publiques sans authentification
 */

export interface SheetData {
  values: string[][];
}

export class PublicSheetsService {
  private readonly API_KEY = 'AIzaSyBvOyisPCYH8IuFK-HuQUQy_MXA5UL6GSQ'; // Clé API publique Google

  /**
   * Extraire l'ID de la feuille depuis une URL Google Sheets
   */
  extractSheetId(url: string): string | null {
    try {
      const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      return match ? match[1] : null;
    } catch (error) {
      console.error("Erreur lors de l'extraction de l'ID:", error);
      return null;
    }
  }

  /**
   * Valider qu'un ID de feuille est au bon format
   */
  validateSheetId(sheetId: string): boolean {
    return /^[a-zA-Z0-9-_]{40,}$/.test(sheetId);
  }

  /**
   * Lire les données d'une feuille Google Sheets publique
   */
  async getSheetData(sheetId: string, range: string = 'A:Z'): Promise<SheetData> {
    if (!this.validateSheetId(sheetId)) {
      throw new Error('ID de feuille invalide');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${this.API_KEY}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Feuille non accessible. Assurez-vous qu\'elle est partagée publiquement.');
        }
        if (response.status === 404) {
          throw new Error('Feuille introuvable. Vérifiez l\'ID de la feuille.');
        }
        throw new Error(`Erreur lors de l'accès à la feuille: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la lecture de la feuille:', error);
      throw error;
    }
  }

  /**
   * Obtenir les informations basiques d'une feuille
   */
  async getSheetInfo(sheetId: string) {
    if (!this.validateSheetId(sheetId)) {
      throw new Error('ID de feuille invalide');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${this.API_KEY}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Feuille non accessible. Assurez-vous qu\'elle est partagée publiquement.');
        }
        if (response.status === 404) {
          throw new Error('Feuille introuvable. Vérifiez l\'ID de la feuille.');
        }
        throw new Error(`Erreur lors de l'accès aux informations de la feuille: ${response.status}`);
      }

      const data = await response.json();
      return {
        title: data.properties.title,
        sheets: data.sheets.map((sheet: any) => ({
          title: sheet.properties.title,
          id: sheet.properties.sheetId
        }))
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des informations:', error);
      throw error;
    }
  }
}

export const publicSheetsService = new PublicSheetsService();
