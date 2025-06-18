
import { Sheet, Client, Campaign } from "../types";
import { getUserAccessToken } from "../utilities";
import { toast } from "sonner";
import { campaignExtractorService } from "../storage/campaignExtractorService";
import { contentGenerationService } from "../contentGenerationService";

// Colonnes validées pour les campagnes publicitaires
export const VALIDATED_COLUMNS = [
  "Nom de la campagne",
  "Nom du groupe d'annonces", 
  "Top 3 mots-clés",
  "Titre 1", "Titre 2", "Titre 3", "Titre 4", "Titre 5",
  "Titre 6", "Titre 7", "Titre 8", "Titre 9", "Titre 10",
  "Description 1", "Description 2", "Description 3", "Description 4", "Description 5"
];

class ConsolidatedSheetService {
  // === CRUD Operations ===
  
  async createSheet(title: string, client: Client | null = null): Promise<Sheet | null> {
    try {
      const accessToken = getUserAccessToken();
      if (!accessToken) return null;

      const headers = VALIDATED_COLUMNS;

      const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: { title },
          sheets: [
            {
              properties: {
                title: "Campagnes publicitaires",
                gridProperties: { rowCount: 100, columnCount: headers.length }
              }
            },
            {
              properties: {
                title: "Informations client", 
                gridProperties: { rowCount: 10, columnCount: 2 }
              }
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erreur lors de la création: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      // Ajouter les en-têtes validés
      await this.writeSheetData(
        data.spreadsheetId, 
        `Campagnes publicitaires!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
        [headers]
      );

      // Enregistrer les informations du client
      if (client) {
        const clientInfo = [
          ["ID Client", client.id],
          ["Nom Client", client.name],
          ["Contexte métier", client.businessContext || ""],
          ["Spécificités", client.specifics || ""],
          ["Charte éditoriale", client.editorialGuidelines || ""]
        ];

        await this.writeSheetData(data.spreadsheetId, "Informations client!A1:B5", clientInfo);
      }

      return {
        id: data.spreadsheetId,
        name: data.properties.title,
        url: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`,
        lastModified: new Date().toISOString(),
        clientId: client?.id,
        clientContext: client?.businessContext
      };
    } catch (error) {
      console.error("Erreur lors de la création de la feuille:", error);
      toast.error("Impossible de créer la feuille Google Sheets");
      return null;
    }
  }

  async deleteSheet(sheetId: string): Promise<boolean> {
    try {
      const accessToken = getUserAccessToken();
      if (!accessToken) return false;

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${sheetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      return response.ok || response.status === 204;
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Impossible de supprimer la feuille");
      return false;
    }
  }

  // === Data Operations ===
  
  async listSheets(): Promise<Sheet[]> {
    try {
      const accessToken = getUserAccessToken();
      if (!accessToken) return [];

      const response = await fetch(
        'https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application%2Fvnd.google-apps.spreadsheet%27',
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!response.ok) throw new Error('Impossible de récupérer les feuilles');

      const data = await response.json();
      return data.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        url: `https://docs.google.com/spreadsheets/d/${file.id}`,
        lastModified: file.modifiedTime
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération des feuilles:", error);
      return [];
    }
  }

  async getSheetData(sheetId: string): Promise<any> {
    try {
      const accessToken = getUserAccessToken();
      if (!accessToken) return null;

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Campagnes%20publicitaires!A1:R1000`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!response.ok) throw new Error('Impossible de récupérer les données');
      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      return null;
    }
  }

  async writeSheetData(sheetId: string, range: string, values: any[][]): Promise<boolean> {
    try {
      const accessToken = getUserAccessToken();
      if (!accessToken) return false;

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            range,
            majorDimension: "ROWS",
            values
          })
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Erreur lors de l'écriture:", error);
      return false;
    }
  }

  async getClientInfo(sheetId: string): Promise<Client | null> {
    try {
      const accessToken = getUserAccessToken();
      if (!accessToken) return null;

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Informations%20client!A1:B5`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (!data.values?.length) return null;

      const clientInfo: Client = { id: '', name: '' };
      
      data.values.forEach((row: string[]) => {
        if (row.length < 2) return;
        
        const key = row[0].toLowerCase();
        const value = row[1];
        
        if (key.includes("id")) clientInfo.id = value;
        else if (key.includes("nom")) clientInfo.name = value;
        else if (key.includes("contexte")) clientInfo.businessContext = value;
        else if (key.includes("spécificité")) clientInfo.specifics = value;
        else if (key.includes("charte") || key.includes("éditor")) clientInfo.editorialGuidelines = value;
      });
      
      return clientInfo;
    } catch (error) {
      console.error("Erreur lors de la récupération des informations client:", error);
      return null;
    }
  }

  // === Business Logic ===
  
  extractCampaigns(sheetId: string): Campaign[] {
    try {
      return campaignExtractorService.extractCampaigns({
        id: sheetId,
        content: [],
        headers: [],
        lastModified: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erreur lors de l'extraction des campagnes:", error);
      return [];
    }
  }

  generateContent = contentGenerationService.generateContent;
}

export const consolidatedSheetService = new ConsolidatedSheetService();
