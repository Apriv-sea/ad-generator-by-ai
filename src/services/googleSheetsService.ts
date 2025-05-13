
import { type Sheet, type Client, type Campaign, type AdGroup, type GenerationPrompt } from "./types";
import { localSheetService } from "./localSheetService";
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

// Export le service combiné avec l'implémentation locale
export const googleSheetsService = {
  createSheet: localSheetService.createSheet,
  listSheets: localSheetService.listSheets,
  getSheetData: localSheetService.getSheetData,
  writeSheetData: localSheetService.writeSheetData,
  getClientInfo: localSheetService.getClientInfo,
  extractCampaigns: localSheetService.extractCampaigns,
  deleteSheet: localSheetService.deleteSheet,
  generateContent: contentGenerationService.generateContent
};
