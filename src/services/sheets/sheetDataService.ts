
import { Sheet, Client } from "../types";
import { getUserAccessToken } from "../utilities";
import { toast } from "sonner";

export const sheetDataService = {
  // Récupérer la liste des feuilles de l'utilisateur
  listSheets: async (): Promise<Sheet[]> => {
    try {
      const accessToken = getUserAccessToken();
      if (!accessToken) return [];

      const response = await fetch(
        'https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application%2Fvnd.google-apps.spreadsheet%27',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur lors de la récupération des feuilles:", errorData);
        throw new Error(`Erreur lors de la récupération des feuilles: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      return data.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        url: `https://docs.google.com/spreadsheets/d/${file.id}`,
        lastModified: file.modifiedTime
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération des feuilles:", error);
      toast.error("Impossible de récupérer vos feuilles Google Sheets");
      return [];
    }
  },

  // Récupérer les données d'une feuille spécifique
  getSheetData: async (sheetId: string): Promise<any> => {
    try {
      const accessToken = getUserAccessToken();
      if (!accessToken) return null;

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Campagnes%20publicitaires!A1:R1000`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur lors de la récupération des données de la feuille:", errorData);
        throw new Error(`Erreur lors de la récupération des données: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération des données de la feuille:", error);
      toast.error("Impossible de récupérer les données de la feuille Google Sheets");
      return null;
    }
  },

  // Écrire des données dans une feuille
  writeSheetData: async (sheetId: string, range: string, values: any[][]): Promise<boolean> => {
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
            range: range,
            majorDimension: "ROWS",
            values: values
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur lors de l'écriture dans la feuille:", errorData);
        throw new Error(`Erreur lors de l'écriture des données: ${errorData.error?.message || response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error("Erreur lors de l'écriture dans la feuille:", error);
      toast.error("Impossible d'écrire les données dans la feuille Google Sheets");
      return false;
    }
  },

  // Récupérer les informations du client à partir de l'onglet "Informations client"
  getClientInfo: async (sheetId: string): Promise<Client | null> => {
    try {
      const accessToken = getUserAccessToken();
      if (!accessToken) return null;

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Informations%20client!A1:B5`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Impossible de récupérer les informations client");
      }

      const data = await response.json();
      if (!data.values || data.values.length === 0) {
        return null;
      }

      // Créer un objet client à partir des données
      const clientInfo: Client = { id: '', name: '' };
      
      data.values.forEach((row: string[]) => {
        if (row.length < 2) return;
        
        const key = row[0].toLowerCase();
        const value = row[1];
        
        if (key.includes("id")) {
          clientInfo.id = value;
        } else if (key.includes("nom")) {
          clientInfo.name = value;
        } else if (key.includes("contexte")) {
          clientInfo.businessContext = value;
        } else if (key.includes("spécificité")) {
          clientInfo.specifics = value;
        } else if (key.includes("charte") || key.includes("éditor")) {
          clientInfo.editorialGuidelines = value;
        }
      });
      
      return clientInfo;
    } catch (error) {
      console.error("Erreur lors de la récupération des informations client:", error);
      toast.error("Impossible de récupérer les informations du client");
      return null;
    }
  }
};
