
import { supabase } from "@/integrations/supabase/client";
import { Client, ClientResponse, SingleClientResponse } from "./types/client";
import { getCurrentUserId } from "./utils/supabaseUtils";

/**
 * Get all clients for the current user
 */
export const getClients = async (): Promise<ClientResponse> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { data: null, error: new Error("User not authenticated") };
    
    // Type-safe approach for Supabase client
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
    
    if (data) {
      // Map snake_case database fields to camelCase JS properties
      const mappedData = data.map(client => ({
        id: client.id,
        name: client.name,
        businessContext: client.business_context,
        specifics: client.specifics,
        editorialGuidelines: client.editorial_guidelines,
        // Include any other fields needed
      }));
      return { data: mappedData as any, error };
    }
    
    return { data, error };
  } catch (error) {
    console.error("Exception lors de la récupération des clients:", error);
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

/**
 * Get a client by ID
 */
export const getClientById = async (clientId: string): Promise<SingleClientResponse> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { data: null, error: new Error("User not authenticated") };
    
    // Type-safe approach for Supabase client
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', userId)
      .single();
    
    if (data) {
      // Map snake_case database fields to camelCase JS properties
      const mappedData = {
        id: data.id,
        name: data.name,
        businessContext: data.business_context,
        specifics: data.specifics,
        editorialGuidelines: data.editorial_guidelines,
        // Include any other fields needed
      };
      return { data: mappedData as any, error };
    }
    
    return { data, error };
  } catch (error) {
    console.error("Exception lors de la récupération du client:", error);
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

/**
 * Get client info for display (name and context)
 */
export const getClientInfo = async (clientId: string): Promise<Pick<Client, 'id' | 'name' | 'businessContext'> | null> => {
  try {
    const { data, error } = await getClientById(clientId);
    
    if (error || !data) {
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      businessContext: data.businessContext || undefined
    };
  } catch (error) {
    console.error("Exception lors de la récupération des infos client:", error);
    return null;
  }
};

export async function getClientShortInfo(clientId: string): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (error || !data) {
      console.error("Erreur lors de la récupération des informations client:", error);
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      businessContext: data.business_context || undefined
    };
  } catch (error) {
    console.error("Exception lors de la récupération des infos client:", error);
    return null;
  }
}
