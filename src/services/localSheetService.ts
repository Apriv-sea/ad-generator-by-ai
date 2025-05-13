
import { Sheet, Client, Campaign } from "./types";
import { sheetStorageService } from "./storage/sheetStorageService";
import { campaignExtractorService } from "./storage/campaignExtractorService";

// Export the actual service with a simpler API
export const localSheetService = {
  /**
   * Create a new sheet
   */
  createSheet: (name: string, client: Client | null = null): Sheet => {
    return sheetStorageService.createSheet(name, client);
  },
  
  /**
   * List all sheets
   */
  listSheets: (): Sheet[] => {
    return sheetStorageService.getSheets();
  },
  
  /**
   * Get data for a specific sheet
   */
  getSheetData: (sheetId: string): any => {
    const data = sheetStorageService.getSheetData(sheetId);
    if (!data) return null;
    
    return {
      values: data.content
    };
  },
  
  /**
   * Write data to a sheet
   */
  writeSheetData: (sheetId: string, range: string, values: any[][]): boolean => {
    // On ignore le range dans cette implémentation locale
    const existingData = sheetStorageService.getSheetData(sheetId);
    if (!existingData) return false;
    
    // Créer une copie des données existantes
    const updatedData = [...existingData.content];
    
    // Mettre à jour les données (à partir de la ligne 2, en préservant les headers)
    for (let i = 0; i < values.length; i++) {
      const rowIndex = i + 1; // +1 car on préserve l'en-tête
      
      // Si la ligne existe déjà, la mettre à jour
      if (rowIndex < updatedData.length) {
        updatedData[rowIndex] = values[i];
      } else {
        // Sinon, ajouter une nouvelle ligne
        updatedData.push(values[i]);
      }
    }
    
    return sheetStorageService.updateSheetData(sheetId, updatedData);
  },
  
  /**
   * Get client information for a sheet
   */
  getClientInfo: (sheetId: string): Client | null => {
    return sheetStorageService.getClientInfo(sheetId);
  },
  
  /**
   * Extract campaigns from sheet data
   */
  extractCampaigns: (sheetId: string): Campaign[] => {
    const sheetData = sheetStorageService.getSheetData(sheetId);
    if (!sheetData) {
      return [{
        name: "",
        context: "",
        adGroups: [{ name: "", keywords: ["", "", ""], context: "" }]
      }];
    }
    
    return campaignExtractorService.extractCampaigns(sheetData);
  },
  
  /**
   * Delete a sheet
   */
  deleteSheet: (sheetId: string): boolean => {
    return sheetStorageService.deleteSheet(sheetId);
  }
};
