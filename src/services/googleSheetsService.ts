
import { type Sheet, type Client, type Campaign, type AdGroup, type GenerationPrompt } from "./types";
import { sheetService } from "./sheetService";
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

export { getClients };

// Export the combined service
export const googleSheetsService = {
  createSheet: sheetService.createSheet,
  listSheets: sheetService.listSheets,
  getSheetData: sheetService.getSheetData,
  writeSheetData: sheetService.writeSheetData,
  getClientInfo: clientService.getClientInfo,
  generateContent: contentGenerationService.generateContent
};
