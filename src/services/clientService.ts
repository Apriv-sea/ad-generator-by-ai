
import { Client } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const getClients = async (): Promise<Client[]> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (error) {
      console.error("Erreur lors de la récupération des clients:", error);
      toast.error("Impossible de récupérer la liste des clients");
      return [];
    }

    return data.map(client => ({
      id: client.id,
      name: client.name,
      businessContext: client.business_context || '',
      specifics: client.specifics || '',
      editorialGuidelines: client.editorial_guidelines || ''
    }));
  } catch (error) {
    console.error("Exception lors de la récupération des clients:", error);
    toast.error("Une erreur s'est produite lors de la récupération des clients");
    return [];
  }
};

export const clientService = {
  // Ajouter un nouveau client
  addClient: async (client: Omit<Client, 'id'>): Promise<Client | null> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: client.name,
          business_context: client.businessContext,
          specifics: client.specifics,
          editorial_guidelines: client.editorialGuidelines
        })
        .select()
        .single();

      if (error) {
        console.error("Erreur lors de l'ajout du client:", error);
        toast.error("Impossible d'ajouter le client");
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        businessContext: data.business_context || '',
        specifics: data.specifics || '',
        editorialGuidelines: data.editorial_guidelines || ''
      };
    } catch (error) {
      console.error("Exception lors de l'ajout du client:", error);
      toast.error("Une erreur s'est produite lors de l'ajout du client");
      return null;
    }
  },

  // Mettre à jour un client existant
  updateClient: async (client: Client): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: client.name,
          business_context: client.businessContext,
          specifics: client.specifics,
          editorial_guidelines: client.editorialGuidelines,
          updated_at: new Date()
        })
        .eq('id', client.id);

      if (error) {
        console.error("Erreur lors de la mise à jour du client:", error);
        toast.error("Impossible de mettre à jour le client");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Exception lors de la mise à jour du client:", error);
      toast.error("Une erreur s'est produite lors de la mise à jour du client");
      return false;
    }
  },

  // Supprimer un client
  deleteClient: async (clientId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) {
        console.error("Erreur lors de la suppression du client:", error);
        toast.error("Impossible de supprimer le client");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Exception lors de la suppression du client:", error);
      toast.error("Une erreur s'est produite lors de la suppression du client");
      return false;
    }
  },

  // Récupérer un client par son ID
  getClientById: async (clientId: string): Promise<Client | null> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) {
        console.error("Erreur lors de la récupération du client:", error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        businessContext: data.business_context || '',
        specifics: data.specifics || '',
        editorialGuidelines: data.editorial_guidelines || ''
      };
    } catch (error) {
      console.error("Exception lors de la récupération du client:", error);
      return null;
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
  }
};

// Helper pour récupérer le token d'accès Google
const getUserAccessToken = () => {
  const user = localStorage.getItem('google_user');
  if (!user) return null;
  
  try {
    const userData = JSON.parse(user);
    return userData.accessToken;
  } catch (error) {
    console.error("Erreur lors de la récupération du token d'accès:", error);
    return null;
  }
};
