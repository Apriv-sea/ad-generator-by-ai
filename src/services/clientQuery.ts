
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
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
    
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
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', userId)
      .single();
    
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
      businessContext: data.business_context || undefined
    };
  } catch (error) {
    console.error("Exception lors de la récupération des infos client:", error);
    return null;
  }
};
