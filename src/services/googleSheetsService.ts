
import { Sheet, Client, Campaign, AdGroup, GenerationPrompt } from "./types";
import { sheetService } from "./sheetService";
import { clientService } from "./clientService";
import { contentGenerationService } from "./contentGenerationService";
import { getClients } from "./clientService";

export { 
  Sheet, 
  Client, 
  Campaign, 
  AdGroup, 
  GenerationPrompt,
  getClients
};

// Export the combined service
export const googleSheetsService = {
  createSheet: sheetService.createSheet,
  listSheets: sheetService.listSheets,
  getSheetData: sheetService.getSheetData,
  writeSheetData: sheetService.writeSheetData,
  getClientInfo: clientService.getClientInfo,
  generateContent: contentGenerationService.generateContent
};
