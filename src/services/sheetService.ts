
import { Campaign } from "./types";
import { campaignExtractorService } from "./storage/campaignExtractorService";
import { contentGenerationService } from "./contentGenerationService";
import { sheetCrudService } from "./sheets/sheetCrudService";
import { sheetDataService } from "./sheets/sheetDataService";

export const sheetService = {
  // Services CRUD
  createSheet: sheetCrudService.createSheet,
  deleteSheet: sheetCrudService.deleteSheet,
  
  // Services de données
  listSheets: sheetDataService.listSheets,
  getSheetData: sheetDataService.getSheetData,
  writeSheetData: sheetDataService.writeSheetData,
  getClientInfo: sheetDataService.getClientInfo,
  
  // Extraire les campagnes d'une feuille
  extractCampaigns: (sheetId: string): Campaign[] => {
    try {
      return campaignExtractorService.extractCampaigns({
        id: sheetId,
        content: [],
        headers: [],
        lastModified: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erreur lors de l'extraction des campagnes:", error);
      return [];
    }
  },
  
  // Générer du contenu pour une campagne
  generateContent: contentGenerationService.generateContent
};
