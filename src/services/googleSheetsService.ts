
import { type Sheet, type Client, type Campaign, type AdGroup, type GenerationPrompt } from "./types";
import { consolidatedSheetService, VALIDATED_COLUMNS } from "./sheets/consolidatedSheetService";
import { clientService } from "./clientService";
import { contentGenerationService } from "./contentGenerationService";
import { getClients } from "./clientQuery";

export type { 
  Sheet, 
  Client, 
  Campaign, 
  AdGroup, 
  GenerationPrompt 
};

export { getClients, contentGenerationService, VALIDATED_COLUMNS };

// Service consolidé avec toutes les fonctionnalités Google Sheets
export const googleSheetsService = {
  // CRUD Operations
  createSheet: consolidatedSheetService.createSheet.bind(consolidatedSheetService),
  deleteSheet: consolidatedSheetService.deleteSheet.bind(consolidatedSheetService),
  
  // Data Operations  
  listSheets: consolidatedSheetService.listSheets.bind(consolidatedSheetService),
  getSheetData: consolidatedSheetService.getSheetData.bind(consolidatedSheetService),
  writeSheetData: consolidatedSheetService.writeSheetData.bind(consolidatedSheetService),
  getClientInfo: consolidatedSheetService.getClientInfo.bind(consolidatedSheetService),
  
  // Business Logic
  extractCampaigns: consolidatedSheetService.extractCampaigns.bind(consolidatedSheetService),
  generateContent: consolidatedSheetService.generateContent
};

// Alias pour la rétrocompatibilité
export const sheetService = googleSheetsService;
