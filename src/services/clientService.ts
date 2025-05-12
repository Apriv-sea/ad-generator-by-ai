
import { Client } from "./types";
import { getUserAccessToken } from "./utilities";
import { toast } from "sonner";

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

export const clientService = {
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
  }
};
