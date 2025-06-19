import { publicSheetsService } from '@/services/google/publicSheetsService';
import { type Sheet, type Client, type Campaign, type AdGroup } from '../types';

export const VALIDATED_COLUMNS = [
  'Nom de la campagne',
  'Nom du groupe d\'annonces',
  'État du groupe d\'annonces',
  'Type de correspondance par défaut',
  'Top 3 mots-clés',
  'Titre 1',
  'Titre 2', 
  'Titre 3',
  'Description 1',
  'Description 2',
  'Description 3',
  'URL finale',
  'Chemin d\'affichage 1',
  'Chemin d\'affichage 2',
  'Mots-clés ciblés',
  'Mots-clés négatifs',
  'Audience ciblée',
  'Extensions d\'annonces'
];

class ConsolidatedSheetService {
  // Créer une feuille fictive (plus besoin de créer via API)
  async createSheet(name: string, clientInfo?: Client): Promise<Sheet> {
    // Simuler la création d'une feuille avec un ID généré
    const sheet: Sheet = {
      id: `sheet_${Date.now()}`,
      name,
      lastModified: new Date().toISOString(),
      clientInfo
    };
    
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
    return true;
  }

  // Récupérer les données d'une feuille via l'API publique
  async getSheetData(sheetId: string): Promise<any> {
    // Si c'est un ID de feuille local, retourner les données stockées
    if (sheetId.startsWith('sheet_')) {
      const storedData = localStorage.getItem(`sheet_data_${sheetId}`);
      return storedData ? JSON.parse(storedData) : null;
    }

    // Sinon, utiliser l'API publique Google Sheets
    return await publicSheetsService.getSheetData(sheetId);
  }

  // Stocker les données d'une feuille connectée
  async connectSheet(sheetId: string, data: any): Promise<void> {
    localStorage.setItem(`sheet_data_${sheetId}`, JSON.stringify(data));
  }

  // Écrire des données dans une feuille (seulement local maintenant)
  async writeSheetData(sheetId: string, data: any[][]): Promise<boolean> {
    if (sheetId.startsWith('sheet_')) {
      localStorage.setItem(`sheet_data_${sheetId}`, JSON.stringify({ values: data }));
      return true;
    }
    
    // Pour les feuilles Google réelles, on ne peut plus écrire
    throw new Error('Impossible d\'écrire dans une feuille Google Sheets en mode lecture seule');
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

  // Extraire les campagnes des données
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

      const campaignName = row[0];
      const adGroupName = row[1];
      if (!campaignName || !adGroupName) continue;

      campaigns.push({
        id: `${id}-${i}`,
        sheetId: id,
        campaignName: campaignName,
        adGroupName: adGroupName,
        keywords: row[2] || '',
        titles: [row[3] || '', row[4] || '', row[5] || ''],
        descriptions: [row[6] || '', row[7] || '', row[8] || ''],
        finalUrls: [row[9] || ''],
        displayPaths: [row[10] || '', row[11] || ''],
        targetedKeywords: row[12] || '',
        negativeKeywords: row[13] || '',
        targetedAudiences: row[14] || '',
        adExtensions: row[15] || '',
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

export const consolidatedSheetService = new ConsolidatedSheetService();
