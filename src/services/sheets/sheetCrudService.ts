
import { Sheet, Client } from "../types";
import { getUserAccessToken } from "../utilities";
import { toast } from "sonner";
import { VALIDATED_COLUMNS } from "../googleSheetsService";

export const sheetCrudService = {
  // Créer une nouvelle feuille Google Sheets avec les colonnes validées
  createSheet: async (title: string, client: Client | null = null): Promise<Sheet | null> => {
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

      // Formatage des en-têtes
      await sheetFormattingService.formatHeaders(data.spreadsheetId, headers.length, accessToken);

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

  // Supprimer une feuille
  deleteSheet: async (sheetId: string): Promise<boolean> => {
    try {
      const accessToken = getUserAccessToken();
      if (!accessToken) return false;

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${sheetId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        console.error("Erreur lors de la suppression de la feuille:", errorData);
        throw new Error(`Erreur lors de la suppression de la feuille: ${errorData.error?.message || response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression de la feuille:", error);
      toast.error("Impossible de supprimer la feuille Google Sheets");
      return false;
    }
  }
};

// Import du service de formatage
import { sheetFormattingService } from "./sheetFormattingService";
