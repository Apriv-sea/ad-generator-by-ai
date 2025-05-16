
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

export { getClients, sheetService, contentGenerationService };

// Les colonnes validées ensemble pour les campagnes publicitaires
export const VALIDATED_COLUMNS = [
  "Nom de la campagne",
  "Nom du groupe d'annonces",
  "Top 3 mots-clés",
  "Titre 1",
  "Titre 2",
  "Titre 3",
  "Titre 4",
  "Titre 5",
  "Titre 6",
  "Titre 7",
  "Titre 8",
  "Titre 9",
  "Titre 10",
  "Description 1",
  "Description 2",
  "Description 3",
  "Description 4",
  "Description 5"
];

// Toutes les fonctionnalités du service sont maintenant fournies par le sheetService
export const googleSheetsService = {
  createSheet: sheetService.createSheet,
  listSheets: sheetService.listSheets,
  getSheetData: sheetService.getSheetData,
  writeSheetData: sheetService.writeSheetData,
  getClientInfo: sheetService.getClientInfo,
  extractCampaigns: sheetService.extractCampaigns,
  deleteSheet: sheetService.deleteSheet,
  generateContent: contentGenerationService.generateContent
};
