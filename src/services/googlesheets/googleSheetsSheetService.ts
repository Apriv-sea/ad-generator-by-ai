
import { googleSheetsService } from './googleSheetsService';
import { type Sheet, type Client, type Campaign } from '../types';

export const VALIDATED_COLUMNS = [
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

class GoogleSheetsSheetService {
  // Créer une feuille avec en-têtes standards (pointe vers une nouvelle feuille Google)
  async createSheet(name: string, clientInfo?: Client): Promise<Sheet> {
    // Générer un ID unique pour cette feuille locale
    const sheetId = `sheet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const sheet: Sheet = {
      id: sheetId,
      name: name,
      lastModified: new Date().toISOString(),
      clientId: clientInfo?.id,
      url: googleSheetsService.createNewSheetUrl()
    };
    
    // Initialiser avec les en-têtes standards dans le localStorage
    const initialData = [
      googleSheetsService.getStandardHeaders(),
      // Ajouter quelques lignes vides pour commencer
      ...Array(10).fill(null).map(() => new Array(googleSheetsService.getStandardHeaders().length).fill(''))
    ];
    
    localStorage.setItem(`sheet_data_${sheetId}`, JSON.stringify({ values: initialData }));
    
    // Stocker dans le localStorage pour la persistance
    const sheets = this.getLocalSheets();
    sheets.push(sheet);
    localStorage.setItem('created_sheets', JSON.stringify(sheets));
    
    return sheet;
  }

  // Lister les feuilles créées localement
  async listSheets(): Promise<Sheet[]> {
    return this.getLocalSheets();
  }

  // Supprimer une feuille du stockage local
  async deleteSheet(sheetId: string): Promise<boolean> {
    const sheets = this.getLocalSheets();
    const filteredSheets = sheets.filter(sheet => sheet.id !== sheetId);
    localStorage.setItem('created_sheets', JSON.stringify(filteredSheets));
    
    // Supprimer aussi les données associées
    localStorage.removeItem(`sheet_data_${sheetId}`);
    localStorage.removeItem(`googlesheets_url_${sheetId}`);
    
    return true;
  }

  // Récupérer les données d'une feuille
  async getSheetData(sheetId: string): Promise<any> {
    // Si c'est un ID de feuille local, retourner les données stockées
    if (sheetId.startsWith('sheet_')) {
      const storedData = localStorage.getItem(`sheet_data_${sheetId}`);
      return storedData ? JSON.parse(storedData) : null;
    }

    // Sinon, utiliser le service Google Sheets
    return await googleSheetsService.getSheetData(sheetId);
  }

  // Écrire des données dans une feuille
  async writeSheetData(sheetId: string, data: any[][]): Promise<boolean> {
    if (sheetId.startsWith('sheet_')) {
      localStorage.setItem(`sheet_data_${sheetId}`, JSON.stringify({ values: data }));
      return true;
    }
    
    // Pour les vraies feuilles Google Sheets
    return await googleSheetsService.saveSheetData(sheetId, data);
  }

  // Obtenir les informations client d'une feuille
  getClientInfo(sheetData: any): Client | null {
    if (!sheetData?.values || sheetData.values.length < 2) {
      return null;
    }

    const clientInfo: Client = { id: '', name: '' };
      
    sheetData.values.forEach((row: string[]) => {
      if (row.length < 2) return;
      
      const key = row[0].toLowerCase();
      const value = row[1];
      
      if (key.includes("id")) clientInfo.id = value;
      else if (key.includes("nom")) clientInfo.name = value;
      else if (key.includes("contexte")) clientInfo.businessContext = value;
      else if (key.includes("spécificité")) clientInfo.specifics = value;
      else if (key.includes("charte") || key.includes("éditor")) clientInfo.editorialGuidelines = value;
    });
    
    return clientInfo;
  }

  // Extraire les campagnes des données (mise à jour pour les nouveaux en-têtes)
  extractCampaigns(sheet: { id: string; content: any[][]; headers: string[]; lastModified: string; clientInfo?: Client | null }): Campaign[] {
    const { id, content, headers, lastModified, clientInfo } = sheet;
    if (!content || content.length <= 1) {
      console.warn(`Pas assez de données dans la feuille ${id} pour extraire les campagnes.`);
      return [];
    }

    const campaigns: Campaign[] = [];
    for (let i = 1; i < content.length; i++) {
      const row = content[i];
      if (!row || row.length === 0) continue;

      const campaignName = row[0]; // Nom de la campagne
      const adGroupName = row[1];  // Nom du groupe d'annonces
      const keywords = row[4];     // Top 3 mots-clés (index 4 dans le nouveau format)
      
      if (!campaignName || !adGroupName) continue;

      campaigns.push({
        id: `${id}-${i}`,
        sheetId: id,
        campaignName: campaignName,
        adGroupName: adGroupName,
        keywords: keywords || '',
        titles: [row[5] || '', row[6] || '', row[7] || ''], // Titre 1, 2, 3
        descriptions: [row[8] || '', row[9] || ''], // Description 1, 2
        finalUrls: [row[10] || ''], // URL finale
        displayPaths: [row[11] || '', row[12] || ''], // Chemin d'affichage 1, 2
        targetedKeywords: row[13] || '', // Mots-clés ciblés
        negativeKeywords: row[14] || '', // Mots-clés négatifs
        targetedAudiences: row[15] || '', // Audience ciblée
        adExtensions: row[16] || '', // Extensions d'annonces
        lastModified: lastModified,
        clientInfo: clientInfo
      });
    }
    return campaigns;
  }

  // Génération de contenu
  async generateContent(sheet: Sheet, prompt: string, targetColumns: string[]): Promise<boolean> {
    console.log(`Génération de contenu pour la feuille ${sheet.id} avec le prompt: ${prompt}`);
    console.log(`Cibler les colonnes: ${targetColumns.join(', ')}`);
    return true;
  }

  // Méthodes utilitaires privées
  private getLocalSheets(): Sheet[] {
    const stored = localStorage.getItem('created_sheets');
    return stored ? JSON.parse(stored) : [];
  }
}

export const googleSheetsSheetService = new GoogleSheetsSheetService();
