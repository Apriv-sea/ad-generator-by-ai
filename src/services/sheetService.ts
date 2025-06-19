
import { type Sheet, type Client, type Campaign } from "./types";
import { cryptpadSheetService, VALIDATED_COLUMNS } from "./cryptpad/cryptpadSheetService";
import { clientService } from "./clientService";
import { contentGenerationService } from "./contentGenerationService";
import { getClients } from "./clientQuery";

export type { 
  Sheet, 
  Client, 
  Campaign 
};

export { getClients, contentGenerationService, VALIDATED_COLUMNS };

// Service principal pour la gestion des feuilles CryptPad
export const sheetService = {
  // CRUD Operations
  createSheet: cryptpadSheetService.createSheet.bind(cryptpadSheetService),
  deleteSheet: cryptpadSheetService.deleteSheet.bind(cryptpadSheetService),
  
  // Data Operations  
  listSheets: cryptpadSheetService.listSheets.bind(cryptpadSheetService),
  getSheetData: cryptpadSheetService.getSheetData.bind(cryptpadSheetService),
  writeSheetData: cryptpadSheetService.writeSheetData.bind(cryptpadSheetService),
  getClientInfo: cryptpadSheetService.getClientInfo.bind(cryptpadSheetService),
  
  // Business Logic
  extractCampaigns: cryptpadSheetService.extractCampaigns.bind(cryptpadSheetService),
  generateContent: cryptpadSheetService.generateContent
};
