
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ClientRecord } from "@/types/supabase-extensions";
import { Client, ClientResponse, SingleClientResponse } from "./types/client";
import { handleSupabaseError } from "./utils/supabaseUtils";

export const getClients = async (): Promise<Client[]> => {
  try {
    // Using type assertion to handle the query
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name') as unknown as ClientResponse;

    if (error) {
      handleSupabaseError(error, "Impossible de récupérer la liste des clients");
      return [];
    }

    if (!data) return [];

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

export const getClientById = async (clientId: string): Promise<Client | null> => {
  try {
    // Using type assertion to handle the query
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single() as unknown as SingleClientResponse;

    if (error) {
      console.error("Erreur lors de la récupération du client:", error);
      return null;
    }

    if (!data) return null;

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
};

export const getClientInfo = async (sheetId: string): Promise<Client | null> => {
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
