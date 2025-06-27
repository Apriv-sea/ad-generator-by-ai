
/**
 * Service pour interagir avec Google Sheets
 */

export interface GoogleSheet {
  id: string;
  name: string;
  url: string;
  type: 'sheet';
}

export interface GoogleSheetData {
  values: string[][];
  title?: string;
}

export class GoogleSheetsService {
  /**
   * Extraire l'ID Google Sheets depuis une URL
   */
  extractSheetId(url: string): string | null {
    try {
      // Format Google Sheets: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
      const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        return match[1];
      }
      
      return null;
    } catch (error) {
      console.error("Erreur lors de l'extraction de l'ID Google Sheets:", error);
      return null;
    }
  }

  /**
   * Valider qu'un ID Google Sheets est au bon format
   */
  validateSheetId(sheetId: string): boolean {
    return /^[a-zA-Z0-9-_]+$/.test(sheetId) && sheetId.length > 10;
  }

  /**
   * Obtenir l'URL d'export CSV pour une feuille Google Sheets
   */
  getExportUrl(sheetId: string): string {
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  }

  /**
   * Obtenir les en-têtes standards pour une feuille de campagnes
   */
  getStandardHeaders(): string[] {
    return [
      'Nom de la campagne',
      'Nom du groupe d\'annonces',
      'État du groupe d\'annonces',
      'Type de correspondance par défaut',
      'Top 3 mots-clés (séparés par des virgules)',
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

  /**
   * Récupérer les données depuis Google Sheets
   */
  async getSheetData(sheetId: string): Promise<GoogleSheetData> {
    if (!this.validateSheetId(sheetId)) {
      throw new Error('ID de feuille Google Sheets invalide');
    }

    console.log("📡 Tentative de récupération des données Google Sheets pour:", sheetId);

    try {
      // Vérifier d'abord si des données existent localement (cache)
      const localData = localStorage.getItem(`sheet_data_${sheetId}`);
      if (localData) {
        console.log("💾 Données trouvées en cache local");
        return JSON.parse(localData);
      }

      // Construire l'URL d'export CSV de Google Sheets
      const exportUrl = this.getExportUrl(sheetId);
      
      console.log("🔗 URL d'export construite:", exportUrl);

      // Tenter de récupérer les données via l'API CSV
      const response = await fetch(exportUrl);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const csvText = await response.text();
      
      if (!csvText || csvText.trim().length === 0) {
        throw new Error("Aucune donnée trouvée dans la feuille");
      }

      // Parser le CSV
      const rows = this.parseCSV(csvText);
      
      if (rows.length === 0) {
        throw new Error("Impossible de parser les données CSV");
      }

      const sheetData: GoogleSheetData = {
        title: 'Feuille Google Sheets',
        values: rows
      };

      // Mettre en cache
      localStorage.setItem(`sheet_data_${sheetId}`, JSON.stringify(sheetData));

      console.log("✅ Données récupérées:", {
        title: sheetData.title,
        rowCount: sheetData.values?.length || 0,
        headers: sheetData.values?.[0],
        hasData: sheetData.values && sheetData.values.length > 1
      });

      return sheetData;

    } catch (error) {
      console.error("❌ Erreur lors de la récupération Google Sheets:", error);
      
      // En cas d'erreur, retourner une structure vide avec les en-têtes standards
      return {
        title: 'Erreur - Feuille vide',
        values: [
          this.getStandardHeaders()
        ]
      };
    }
  }

  /**
   * Parser CSV simple
   */
  private parseCSV(csvText: string): string[][] {
    const rows: string[][] = [];
    const lines = csvText.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        // Parser CSV simple (peut être amélioré pour gérer les virgules dans les cellules)
        const cells = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
        rows.push(cells);
      }
    }
    
    return rows;
  }

  /**
   * Obtenir les informations basiques d'une feuille
   */
  async getSheetInfo(sheetId: string) {
    if (!this.validateSheetId(sheetId)) {
      throw new Error('ID de feuille Google Sheets invalide');
    }

    return {
      title: 'Feuille Google Sheets - Campagnes',
      type: 'sheet' as const,
      owner: 'Vous',
      lastModified: new Date().toISOString()
    };
  }

  /**
   * Créer un nouveau lien vers Google Sheets (ouvre une nouvelle feuille)
   */
  createNewSheetUrl(): string {
    return 'https://docs.google.com/spreadsheets/create';
  }

  /**
   * Sauvegarder des données dans une feuille (simulation pour démo)
   */
  async saveSheetData(sheetId: string, data: string[][]): Promise<boolean> {
    if (!this.validateSheetId(sheetId)) {
      throw new Error('ID de feuille Google Sheets invalide');
    }

    // Simuler la sauvegarde
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Stocker localement pour la démo
    localStorage.setItem(`sheet_data_${sheetId}`, JSON.stringify({ values: data }));
    
    return true;
  }
}

export const googleSheetsService = new GoogleSheetsService();
