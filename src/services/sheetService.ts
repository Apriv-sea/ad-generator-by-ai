/**
 * Service principal unifié pour la gestion des feuilles Google Sheets
 */

import { type Sheet, type Client, type Campaign } from "./types";
import { googleSheetsCoreService } from "./core/googleSheetsCore";
import { clientService } from "./clientService";
import { getClients } from "./clientQuery";

export type { 
  Sheet, 
  Client, 
  Campaign 
};

export { getClients };

// Colonnes validées pour l'extraction de campagnes
export const VALIDATED_COLUMNS = [
  'Nom de la campagne',
  'Nom du groupe d\'annonces',
  'État du groupe d\'annonces',
  'Type de correspondance par défaut',
  'Top 3 mots-clés (séparés par des virgules)',
  'Titre 1', 'Titre 2', 'Titre 3',
  'Description 1', 'Description 2',
  'URL finale',
  'Chemin d\'affichage 1', 'Chemin d\'affichage 2',
  'Mots-clés ciblés', 'Mots-clés négatifs',
  'Audience ciblée', 'Extensions d\'annonces'
];

// Service principal pour la gestion des feuilles Google Sheets
export const sheetService = {
  // Authentification
  isAuthenticated: () => googleSheetsCoreService.isAuthenticated(),
  initiateAuth: () => googleSheetsCoreService.initiateAuth(),
  completeAuth: (code: string, state?: string) => googleSheetsCoreService.completeAuth(code, state || ''),
  logout: () => googleSheetsCoreService.logout(),
  
  // Manipulation des feuilles
  extractSheetId: (url: string) => googleSheetsCoreService.extractSheetId(url),
  getSheetData: (sheetId: string, range?: string) => googleSheetsCoreService.getSheetData(sheetId, range),
  saveSheetData: (sheetId: string, data: string[][], range?: string) => googleSheetsCoreService.saveSheetData(sheetId, data, range),
  createNewSheetUrl: () => googleSheetsCoreService.createNewSheetUrl(),
  
  // Extraction et génération de contenu
  extractCampaigns: async (sheetData: string[][], clientInfo?: Client) => {
    // Logique d'extraction simplifiée
    if (!sheetData || sheetData.length < 2) {
      throw new Error('Données de feuille insuffisantes');
    }

    const headers = sheetData[0];
    const rows = sheetData.slice(1);
    
    return rows.map((row, index) => ({
      id: `campaign_${index}`,
      campaignName: row[0] || `Campagne ${index + 1}`,
      adGroupName: row[1] || `Groupe ${index + 1}`,
      keywords: row[4] || '',
      clientId: clientInfo?.id
    }));
  },

  generateContent: async (campaigns: any[]) => {
    // Génération simplifiée pour compatibilité
    console.log('Génération de contenu pour', campaigns.length, 'campagnes');
    return { success: true, results: campaigns };
  }
};