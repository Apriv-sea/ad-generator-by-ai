
import { toast } from "sonner";

export interface Sheet {
  id: string;
  name: string;
  url: string;
  lastModified: string;
}

export const googleSheetsService = {
  // Créer une nouvelle feuille Google Sheets
  createSheet: async (title: string): Promise<Sheet | null> => {
    try {
      const accessToken = getUserAccessToken();
      if (!accessToken) return null;

      const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: title
          },
          sheets: [
            {
              properties: {
                title: "Campagnes publicitaires",
                gridProperties: {
                  rowCount: 100,
                  columnCount: 20
                }
              }
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur lors de la création de la feuille:", errorData);
        throw new Error(`Erreur lors de la création de la feuille: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.spreadsheetId,
        name: data.properties.title,
        url: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`,
        lastModified: new Date().toISOString()
      };
    } catch (error) {
      console.error("Erreur lors de la création de la feuille:", error);
      toast.error("Impossible de créer la feuille Google Sheets");
      return null;
    }
  },

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
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Campagnes!A1:Z1000`,
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
  }
};

// Fonction utilitaire pour récupérer le token d'accès
const getUserAccessToken = (): string | null => {
  const user = localStorage.getItem('google_user');
  if (!user) {
    toast.error("Veuillez vous connecter avec Google");
    return null;
  }

  const userData = JSON.parse(user);
  return userData.accessToken;
};
