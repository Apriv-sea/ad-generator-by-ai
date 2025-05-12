
import { toast } from "sonner";

export interface Sheet {
  id: string;
  name: string;
  url: string;
  lastModified: string;
}

export interface Client {
  id: string;
  name: string;
}

export interface Campaign {
  name: string;
  adGroups: AdGroup[];
  context: string;
}

export interface AdGroup {
  name: string;
  keywords: string[];
  context: string;
}

export interface GenerationPrompt {
  clientContext: string;
  campaignContext: string;
  adGroupContext: string;
  keywords: string[];
  model: string;
}

export const googleSheetsService = {
  // Créer une nouvelle feuille Google Sheets avec le template spécifique
  createSheet: async (title: string): Promise<Sheet | null> => {
    try {
      const accessToken = getUserAccessToken();
      if (!accessToken) return null;

      // Définition des en-têtes de colonnes pour notre template
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
      
      // Après avoir créé la feuille, on ajoute les en-têtes
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${data.spreadsheetId}/values/Campagnes%20publicitaires!A1:R1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            range: "Campagnes publicitaires!A1:R1",
            majorDimension: "ROWS",
            values: [headers]
          })
        }
      );

      // Formatage des en-têtes en gras
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

  // Générer du contenu via un LLM (simulation pour l'instant)
  generateContent: async (prompt: GenerationPrompt): Promise<{titles: string[], descriptions: string[]} | null> => {
    try {
      // Cette fonction sera remplacée par un appel réel à un LLM
      // Pour l'instant, on renvoie des données simulées
      
      console.log("Prompt de génération:", prompt);
      
      // Simulation d'un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulation de réponse
      const titles = [
        `Découvrez ${prompt.keywords[0]} maintenant`,
        `${prompt.keywords[1]} - Solutions expertisées`,
        `${prompt.keywords[0]} et ${prompt.keywords[2]} combinés`,
        `Nos services de ${prompt.keywords[1]}`,
        `${prompt.keywords[2]} - Résultats garantis`,
        `${prompt.keywords[0]} pour professionnels`,
        `Solutions ${prompt.keywords[1]} innovantes`,
        `${prompt.keywords[2]} à prix imbattable`,
        `Expertise en ${prompt.keywords[0]}`,
        `${prompt.keywords[1]} - Contactez nos experts`
      ];
      
      const descriptions = [
        `Profitez de nos services de ${prompt.keywords[0]} adaptés à vos besoins spécifiques. Contactez-nous dès aujourd'hui !`,
        `${prompt.keywords[1]} de qualité supérieure avec garantie de résultat. Devis gratuit en ligne.`,
        `Experts en ${prompt.keywords[2]} depuis 10 ans. Solutions innovantes pour votre entreprise.`,
        `Forfaits ${prompt.keywords[0]} à partir de 99€. Satisfaction client garantie.`,
        `${prompt.keywords[1]} et ${prompt.keywords[2]} - Notre équipe à votre service 7j/7.`
      ];
      
      return { titles, descriptions };
    } catch (error) {
      console.error("Erreur lors de la génération de contenu:", error);
      toast.error("Impossible de générer le contenu via l'IA");
      return null;
    }
  }
};

// Liste temporaire de clients (à remplacer par une vraie API)
export const getClients = async (): Promise<Client[]> => {
  return [
    { id: '1', name: 'ABC Company' },
    { id: '2', name: 'XYZ Corporation' },
    { id: '3', name: 'Tech Solutions' },
  ];
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
