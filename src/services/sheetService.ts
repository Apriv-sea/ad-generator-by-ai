
import { type Sheet, type Client, type Campaign } from "./types";
import { googleSheetsSheetService, VALIDATED_COLUMNS } from "./googlesheets/googleSheetsSheetService";
import { clientService } from "./clientService";
import { contentGenerationService } from "./contentGenerationService";
import { getClients } from "./clientQuery";

export type { 
  Sheet, 
  Client, 
  Campaign 
};

export { getClients, contentGenerationService, VALIDATED_COLUMNS };

// Service principal pour la gestion des feuilles Google Sheets
export const sheetService = {
  // CRUD Operations
  createSheet: googleSheetsSheetService.createSheet.bind(googleSheetsSheetService),
  deleteSheet: googleSheetsSheetService.deleteSheet.bind(googleSheetsSheetService),
  
  // Data Operations  
  listSheets: googleSheetsSheetService.listSheets.bind(googleSheetsSheetService),
  getSheetData: googleSheetsSheetService.getSheetData.bind(googleSheetsSheetService),
  writeSheetData: googleSheetsSheetService.writeSheetData.bind(googleSheetsSheetService),
  getClientInfo: googleSheetsSheetService.getClientInfo.bind(googleSheetsSheetService),
  
  // Business Logic
  extractCampaigns: googleSheetsSheetService.extractCampaigns.bind(googleSheetsSheetService),
  generateContent: googleSheetsSheetService.generateContent
};
