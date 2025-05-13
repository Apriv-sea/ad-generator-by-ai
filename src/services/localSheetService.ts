
import { Sheet, Client, Campaign, AdGroup } from "./types";
import { toast } from "sonner";

// Type pour les données des tableurs
export interface SheetData {
  id: string;
  content: any[][];
  headers: string[];
  clientInfo?: Client;
  lastModified: string;
}

// Classe pour gérer le stockage local
class LocalSheetStorage {
  private storageKey = 'local_sheets';

  // Récupérer toutes les feuilles stockées localement
  getSheets(): Sheet[] {
    try {
      const sheetsData = localStorage.getItem(this.storageKey);
      if (!sheetsData) return [];
      
      const sheets = JSON.parse(sheetsData) as Sheet[];
      return sheets;
    } catch (error) {
      console.error("Erreur lors de la récupération des feuilles:", error);
      toast.error("Impossible de récupérer les feuilles stockées");
      return [];
    }
  }

  // Récupérer les données d'une feuille spécifique
  getSheetData(sheetId: string): SheetData | null {
    try {
      const dataKey = `sheet_data_${sheetId}`;
      const sheetData = localStorage.getItem(dataKey);
      if (!sheetData) return null;
      
      return JSON.parse(sheetData) as SheetData;
    } catch (error) {
      console.error("Erreur lors de la récupération des données de la feuille:", error);
      toast.error("Impossible de récupérer les données de la feuille");
      return null;
    }
  }

  // Récupérer les informations du client pour une feuille
  getClientInfo(sheetId: string): Client | null {
    try {
      const sheetData = this.getSheetData(sheetId);
      return sheetData?.clientInfo || null;
    } catch (error) {
      console.error("Erreur lors de la récupération des informations client:", error);
      return null;
    }
  }

  // Créer une nouvelle feuille
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
      localStorage.setItem(this.storageKey, JSON.stringify(sheets));
      
      // Enregistrer les données de la feuille
      const dataKey = `sheet_data_${id}`;
      localStorage.setItem(dataKey, JSON.stringify(sheetData));
      
      return newSheet;
    } catch (error) {
      console.error("Erreur lors de la création de la feuille:", error);
      toast.error("Impossible de créer la feuille");
      throw error;
    }
  }

  // Mettre à jour les données d'une feuille
  updateSheetData(sheetId: string, data: any[][]): boolean {
    try {
      const sheetData = this.getSheetData(sheetId);
      if (!sheetData) return false;
      
      sheetData.content = data;
      sheetData.lastModified = new Date().toISOString();
      
      const dataKey = `sheet_data_${sheetId}`;
      localStorage.setItem(dataKey, JSON.stringify(sheetData));
      
      // Mettre à jour la date de dernière modification dans la liste
      const sheets = this.getSheets();
      const sheetIndex = sheets.findIndex(s => s.id === sheetId);
      if (sheetIndex >= 0) {
        sheets[sheetIndex].lastModified = new Date().toISOString();
        localStorage.setItem(this.storageKey, JSON.stringify(sheets));
      }
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour des données:", error);
      toast.error("Impossible de mettre à jour les données de la feuille");
      return false;
    }
  }

  // Supprimer une feuille
  deleteSheet(sheetId: string): boolean {
    try {
      // Supprimer les données de la feuille
      const dataKey = `sheet_data_${sheetId}`;
      localStorage.removeItem(dataKey);
      
      // Supprimer la feuille de la liste
      const sheets = this.getSheets();
      const filteredSheets = sheets.filter(sheet => sheet.id !== sheetId);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredSheets));
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression de la feuille:", error);
      toast.error("Impossible de supprimer la feuille");
      return false;
    }
  }

  // Extraire les campagnes à partir des données du tableur
  extractCampaigns(sheetData: SheetData): Campaign[] {
    try {
      if (!sheetData || !sheetData.content || sheetData.content.length <= 1) {
        return [{
          name: "",
          context: "",
          adGroups: [{
            name: "",
            keywords: ["", "", ""],
            context: ""
          }]
        }];
      }
      
      // Ignorer la ligne d'en-tête
      const rows = sheetData.content.slice(1);
      
      // Regrouper par campagne
      const campaignMap = new Map<string, any[]>();
      rows.forEach((row: any[]) => {
        if (row.length >= 3 && row[0]) {
          const campaignName = row[0];
          if (!campaignMap.has(campaignName)) {
            campaignMap.set(campaignName, []);
          }
          campaignMap.get(campaignName)?.push(row);
        }
      });
      
      // Convertir en structure de données
      const campaigns: Campaign[] = [];
      campaignMap.forEach((rows, campaignName) => {
        const adGroups: AdGroup[] = [];
        const processedAdGroups = new Set<string>();
        
        rows.forEach(row => {
          if (row.length >= 3 && row[1] && !processedAdGroups.has(row[1])) {
            const adGroupName = row[1];
            processedAdGroups.add(adGroupName);
            
            // Extraire les mots-clés
            const keywords = row[2] ? String(row[2]).split(',').map(k => k.trim()).filter(k => k) : [];
            
            adGroups.push({
              name: adGroupName,
              keywords: keywords.length > 0 ? keywords : [""],
              context: ""
            });
          }
        });
        
        campaigns.push({
          name: campaignName,
          adGroups,
          context: ""
        });
      });
      
      return campaigns.length > 0 ? campaigns : [{
        name: "",
        context: "",
        adGroups: [{
          name: "",
          keywords: ["", "", ""],
          context: ""
        }]
      }];
    } catch (error) {
      console.error("Erreur lors de l'extraction des campagnes:", error);
      return [{
        name: "",
        context: "",
        adGroups: [{
          name: "",
          keywords: ["", "", ""],
          context: ""
        }]
      }];
    }
  }
}

// Instance unique du service
export const localSheetStorage = new LocalSheetStorage();

// Service exposé
export const localSheetService = {
  createSheet: (name: string, client: Client | null = null): Sheet => {
    return localSheetStorage.createSheet(name, client);
  },
  
  listSheets: (): Sheet[] => {
    return localSheetStorage.getSheets();
  },
  
  getSheetData: (sheetId: string): any => {
    const data = localSheetStorage.getSheetData(sheetId);
    if (!data) return null;
    
    return {
      values: data.content
    };
  },
  
  writeSheetData: (sheetId: string, range: string, values: any[][]): boolean => {
    // On ignore le range dans cette implémentation locale
    const existingData = localSheetStorage.getSheetData(sheetId);
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
    
    return localSheetStorage.updateSheetData(sheetId, updatedData);
  },
  
  getClientInfo: (sheetId: string): Client | null => {
    return localSheetStorage.getClientInfo(sheetId);
  },
  
  extractCampaigns: (sheetId: string): Campaign[] => {
    const sheetData = localSheetStorage.getSheetData(sheetId);
    if (!sheetData) {
      return [{
        name: "",
        context: "",
        adGroups: [{ name: "", keywords: ["", "", ""], context: "" }]
      }];
    }
    
    return localSheetStorage.extractCampaigns(sheetData);
  },
  
  deleteSheet: (sheetId: string): boolean => {
    return localSheetStorage.deleteSheet(sheetId);
  }
};
