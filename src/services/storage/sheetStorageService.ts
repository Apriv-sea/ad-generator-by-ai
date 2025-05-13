
import { Sheet, Client, Campaign } from "../types";
import { SheetData } from "../types/sheetData";
import { localStorageUtils } from "./localStorageUtils";
import { toast } from "sonner";
import { campaignExtractorService } from "./campaignExtractorService";

/**
 * Service for managing sheets storage in localStorage
 */
class SheetStorageService {
  private storageKey = 'local_sheets';

  /**
   * Get all sheets stored locally
   */
  getSheets(): Sheet[] {
    try {
      const sheets = localStorageUtils.getItem<Sheet[]>(this.storageKey);
      return sheets || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des feuilles:", error);
      toast.error("Impossible de récupérer les feuilles stockées");
      return [];
    }
  }

  /**
   * Get data for a specific sheet
   */
  getSheetData(sheetId: string): SheetData | null {
    try {
      const dataKey = `sheet_data_${sheetId}`;
      return localStorageUtils.getItem<SheetData>(dataKey);
    } catch (error) {
      console.error("Erreur lors de la récupération des données de la feuille:", error);
      toast.error("Impossible de récupérer les données de la feuille");
      return null;
    }
  }

  /**
   * Get client information for a sheet
   */
  getClientInfo(sheetId: string): Client | null {
    try {
      const sheetData = this.getSheetData(sheetId);
      return sheetData?.clientInfo || null;
    } catch (error) {
      console.error("Erreur lors de la récupération des informations client:", error);
      return null;
    }
  }

  /**
   * Create a new sheet
   */
  createSheet(name: string, client: Client | null = null): Sheet {
    try {
      // Générer un ID unique
      const id = `sheet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Définir les en-têtes par défaut
      const headers = [
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
      
      // Créer les données initiales (headers + 10 lignes vides)
      const initialData: any[][] = [headers];
      for (let i = 0; i < 10; i++) {
        initialData.push(Array(headers.length).fill(''));
      }
      
      // Créer l'objet Sheet
      const newSheet: Sheet = {
        id,
        name,
        url: `#/campaigns/editor/${id}`,
        lastModified: new Date().toISOString(),
        clientId: client?.id,
        clientContext: client?.businessContext
      };
      
      // Créer l'objet SheetData
      const sheetData: SheetData = {
        id,
        content: initialData,
        headers,
        clientInfo: client || undefined,
        lastModified: new Date().toISOString()
      };
      
      // Enregistrer la feuille dans la liste
      const sheets = this.getSheets();
      sheets.push(newSheet);
      localStorageUtils.setItem(this.storageKey, sheets);
      
      // Enregistrer les données de la feuille
      const dataKey = `sheet_data_${id}`;
      localStorageUtils.setItem(dataKey, sheetData);
      
      return newSheet;
    } catch (error) {
      console.error("Erreur lors de la création de la feuille:", error);
      toast.error("Impossible de créer la feuille");
      throw error;
    }
  }

  /**
   * Update data for a sheet
   */
  updateSheetData(sheetId: string, data: any[][]): boolean {
    try {
      const sheetData = this.getSheetData(sheetId);
      if (!sheetData) return false;
      
      sheetData.content = data;
      sheetData.lastModified = new Date().toISOString();
      
      const dataKey = `sheet_data_${sheetId}`;
      localStorageUtils.setItem(dataKey, sheetData);
      
      // Mettre à jour la date de dernière modification dans la liste
      const sheets = this.getSheets();
      const sheetIndex = sheets.findIndex(s => s.id === sheetId);
      if (sheetIndex >= 0) {
        sheets[sheetIndex].lastModified = new Date().toISOString();
        localStorageUtils.setItem(this.storageKey, sheets);
      }
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour des données:", error);
      toast.error("Impossible de mettre à jour les données de la feuille");
      return false;
    }
  }

  /**
   * Delete a sheet
   */
  deleteSheet(sheetId: string): boolean {
    try {
      // Supprimer les données de la feuille
      const dataKey = `sheet_data_${sheetId}`;
      localStorageUtils.removeItem(dataKey);
      
      // Supprimer la feuille de la liste
      const sheets = this.getSheets();
      const filteredSheets = sheets.filter(sheet => sheet.id !== sheetId);
      localStorageUtils.setItem(this.storageKey, filteredSheets);
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression de la feuille:", error);
      toast.error("Impossible de supprimer la feuille");
      return false;
    }
  }
}

// Export a single instance
export const sheetStorageService = new SheetStorageService();
