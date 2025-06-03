
import { getUserAccessToken } from "../utilities";

export const sheetFormattingService = {
  // Formater les en-têtes d'une feuille
  formatHeaders: async (spreadsheetId: string, headerCount: number, accessToken?: string): Promise<void> => {
    try {
      const token = accessToken || getUserAccessToken();
      if (!token) return;

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
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
                    endColumnIndex: headerCount
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
    } catch (error) {
      console.error("Erreur lors du formatage des en-têtes:", error);
    }
  }
};
