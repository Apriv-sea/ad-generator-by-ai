import { Sheet, Client } from "./types";
import { getUserAccessToken } from "./utilities";
import { toast } from "sonner";
import { VALIDATED_COLUMNS } from "./googleSheetsService";

export const sheetService = {
  // Créer une nouvelle feuille Google Sheets avec les colonnes validées
  createSheet: async (title: string, client: Client | null = null): Promise<Sheet | null> => {
    try {
      const accessToken = getUserAccessToken();
      if (!accessToken) return null;

      // Utiliser les en-têtes validés
      const headers = VALIDATED_COLUMNS;

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
                  columnCount: headers.length
                }
              }
            },
            {
              properties: {
                title: "Informations client",
                gridProperties: {
                  rowCount: 10,
                  columnCount: 2
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
      
      // Après avoir créé la feuille, on ajoute les en-têtes validés
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${data.spreadsheetId}/values/Campagnes%20publicitaires!A1:${String.fromCharCode(65 + headers.length - 1)}1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            range: `Campagnes publicitaires!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
            majorDimension: "ROWS",
            values: [headers]
          })
        }
      );

      // Enregistrer les informations du client dans l'onglet "Informations client"
      if (client) {
        const clientInfo = [
          ["ID Client", client.id],
          ["Nom Client", client.name],
          ["Contexte métier", client.businessContext || ""],
          ["Spécificités", client.specifics || ""],
          ["Charte éditoriale", client.editorialGuidelines || ""]
        ];

        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${data.spreadsheetId}/values/Informations%20client!A1:B5?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              range: "Informations client!A1:B5",
              majorDimension: "ROWS",
              values: clientInfo
            })
          }
        );
      }

      // Formatage des en-têtes en gras et avec un arrière-plan gris
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${data.spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId: 0,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: 0,
                    endColumnIndex: headers.length
                  },
                  cell: {
                    userEnteredFormat: {
                      textFormat: {
                        bold: true
                      },
                      backgroundColor: {
                        red: 0.9,
                        green: 0.9,
                        blue: 0.9
                      }
                    }
                  },
                  fields: "userEnteredFormat(textFormat,backgroundColor)"
                }
              },
              {
                updateSheetProperties: {
                  properties: {
                    sheetId: 0,
                    gridProperties: {
                      frozenRowCount: 1
                    }
                  },
                  fields: "gridProperties.frozenRowCount"
                }
              }
            ]
          })
        }
      );

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
  }
};
