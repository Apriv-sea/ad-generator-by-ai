import { toast } from "sonner";

export interface Sheet {
  id: string;
  name: string;
  url: string;
  lastModified: string;
  clientId?: string;
  clientContext?: string;
}

export interface Client {
  id: string;
  name: string;
  businessContext?: string;
  specifics?: string;
  editorialGuidelines?: string;
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
  createSheet: async (title: string, client: Client | null = null): Promise<Sheet | null> => {
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
  },

  // Récupérer les informations du client associées à une feuille
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
        console.error("Erreur lors de la récupération des informations du client");
        return null;
      }

      const data = await response.json();
      
      if (!data.values || data.values.length < 2) {
        return null;
      }

      // Construire l'objet client à partir des données de la feuille
      const clientInfo: Record<string, string> = {};
      data.values.forEach((row: string[]) => {
        if (row.length >= 2) {
          const key = row[0].toLowerCase().replace(/ /g, '_');
          clientInfo[key] = row[1];
        }
      });

      return {
        id: clientInfo['id_client'] || '',
        name: clientInfo['nom_client'] || '',
        businessContext: clientInfo['contexte_métier'] || '',
        specifics: clientInfo['spécificités'] || '',
        editorialGuidelines: clientInfo['charte_éditoriale'] || ''
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des informations du client:", error);
      return null;
    }
  },

  // Générer du contenu via un LLM
  generateContent: async (prompt: GenerationPrompt): Promise<{titles: string[], descriptions: string[]} | null> => {
    try {
      console.log("Prompt de génération:", prompt);
      
      // Construire le prompt pour les titres
      const titlePrompt = `Vous êtes un rédacteur publicitaire hautement qualifié avec une solide expérience en rédaction persuasive, en optimisation des conversions et en techniques de marketing. Vous rédigez des textes convaincants qui touchent les émotions et les besoins du public cible, les incitant à agir ou à acheter. Vous comprenez l'importance de la méthode AIDA (Attention, Intérêt, Désir et Action) et d'autres formules de rédaction éprouvées, que vous intégrez parfaitement dans vos écrits. Vous avez un talent pour créer des titres accrocheurs, des introductions captivantes et des appels à l'action persuasifs. Vous maîtrisez bien la psychologie des consommateurs et utilisez ces connaissances pour créer des messages qui résonnent avec le public cible.

En vous basant sur les informations concernant l'annonceur : '''${prompt.clientContext}''', 
et sur le role de la campagne : '''${prompt.campaignContext}''',
ainsi que sur le nom de l'ad group qui permet soit d'obtenir le nom d'une marque soit la typologie ou l'univers produit : '''${prompt.adGroupContext}''', enfin il faut utiliser les top mots clés de l'ad group : ${prompt.keywords.join(', ')} pour bien identifier l'univers sémantique.  

Rédigez une liste de 10 titres à la fois sobres et engageants pour les annonces Google en ne mentionnant la marque seulement que pour 5 titres, alignés avec le sujet de l'ad group en respectant strictement 30 caractères maximum, ne pas proposer si ça dépasse. Affichez uniquement la liste sans aucun texte préliminaire ou conclusion. Pas de mise en forme particulière, chaque titre doit être l'une en dessous de l'autre sans numéro ou tiret ou police particulière.`;

      // Construire le prompt pour les descriptions
      const descriptionPrompt = `Vous êtes un rédacteur publicitaire hautement qualifié avec une solide expérience en rédaction persuasive, en optimisation des conversions et en techniques de marketing. Vous rédigez des textes convaincants qui touchent les émotions et les besoins du public cible, les incitant à agir ou à acheter.

En vous basant sur les informations concernant l'annonceur : '''${prompt.clientContext}''', 
et sur le role de la campagne : '''${prompt.campaignContext}''',
ainsi que sur le nom de l'ad group qui permet soit d'obtenir le nom d'une marque soit la typologie ou l'univers produit : '''${prompt.adGroupContext}''', enfin il faut utiliser les top mots clés de l'ad group : ${prompt.keywords.join(', ')} pour bien identifier l'univers sémantique.

Rédigez une liste de 5 descriptions d'annonces Google persuasives et engageantes en respectant strictement 90 caractères maximum, ne pas proposer si ça dépasse. Incluez un appel à l'action clair dans chaque description. Affichez uniquement la liste sans aucun texte préliminaire ou conclusion. Pas de mise en forme particulière, chaque description doit être l'une en dessous de l'autre sans numéro ou tiret.`;

      // Simulation d'un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Dans un environnement réel, vous feriez un appel API à votre LLM ici
      // Exemple avec le modèle sélectionné par l'utilisateur
      
      // Envoyer les prompts à l'API (simulé pour l'instant)
      let titles: string[] = [];
      let descriptions: string[] = [];
      
      // Si vous implémentez réellement l'appel à l'API, vous pourriez le faire comme ceci:
      /*
      const titleResponse = await fetch('URL_DE_VOTRE_API_LLM', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: titlePrompt,
          model: prompt.model,
          // autres paramètres...
        }),
      });
      
      const titleData = await titleResponse.json();
      titles = parseResponseForTitles(titleData);
      
      const descriptionResponse = await fetch('URL_DE_VOTRE_API_LLM', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: descriptionPrompt,
          model: prompt.model,
          // autres paramètres...
        }),
      });
      
      const descriptionData = await descriptionResponse.json();
      descriptions = parseResponseForDescriptions(descriptionData);
      */
      
      // Pour l'instant, générer des exemples de titres et descriptions
      titles = [
        `Découvrez ${prompt.keywords[0]} maintenant`,
        `${prompt.keywords[0]} - Solutions efficaces`,
        `${prompt.keywords[1]} pour professionnels`,
        `Meilleur service ${prompt.keywords[0]}`,
        `${prompt.keywords[1]} à prix abordable`,
        `${prompt.keywords[2]} premium`,
        `Solutions ${prompt.keywords[0]} sur mesure`,
        `${prompt.keywords[1]} - Résultats garantis`,
        `Experts en ${prompt.keywords[0]}`,
        `${prompt.keywords[2]} - Action rapide`
      ];
      
      descriptions = [
        `Profitez de nos services de ${prompt.keywords[0]} adaptés à vos besoins. Contactez-nous !`,
        `${prompt.keywords[1]} de qualité avec garantie. Demandez un devis gratuit en ligne.`,
        `Experts en ${prompt.keywords[2]} depuis 10 ans. Appelez-nous dès maintenant.`,
        `Solutions ${prompt.keywords[0]} innovantes à prix compétitif. Cliquez ici !`,
        `${prompt.keywords[1]} et ${prompt.keywords[0]} - Notre équipe à votre service 7j/7.`
      ];
      
      console.log("Contenu généré:", { titles, descriptions });
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
    { 
      id: '1', 
      name: 'ABC Company', 
      businessContext: 'Entreprise spécialisée dans la vente de matériel informatique pour professionnels. Présente depuis 15 ans sur le marché avec une forte implantation régionale.',
      specifics: 'Service après-vente réactif, délais de livraison courts, expertise technique reconnue',
      editorialGuidelines: 'Ton professionnel, technique mais accessible. Éviter le jargon trop complexe.'
    },
    { 
      id: '2', 
      name: 'XYZ Corporation', 
      businessContext: 'Cabinet de conseil en stratégie digitale pour PME en phase de transformation numérique.',
      specifics: 'Approche sur mesure, accompagnement personnalisé, expertise en cybersécurité',
      editorialGuidelines: 'Ton confiant et expert, utiliser des exemples concrets, éviter les anglicismes.'
    },
    { 
      id: '3', 
      name: 'Tech Solutions', 
      businessContext: 'Startup proposant des solutions SaaS pour l\'automatisation des tâches administratives.',
      specifics: 'Interface intuitive, intégration avec les outils existants, économie de temps prouvée',
      editorialGuidelines: 'Ton dynamique et innovant, mettre en avant les gains de productivité, utiliser un vocabulaire moderne.'
    },
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
