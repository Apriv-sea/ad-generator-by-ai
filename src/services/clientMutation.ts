
import { supabase } from "@/integrations/supabase/client";
import { Client } from "./types/client";
import { getCurrentUserId } from "./utils/supabaseUtils";
import { mapClientToClientRecord } from "./mappers/clientMapper";

/**
 * Create a new client
 */
export const addClient = async (client: Partial<Client>): Promise<string | null> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;
    
    // Convert client object to database format
    const clientRecord = mapClientToClientRecord(client);
    
    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...clientRecord,
        user_id: userId
      })
      .select();
    
    if (error || !data || data.length === 0) {
      console.error("Error creating client:", error);
      return null;
    }
    
    return data[0].id;
  } catch (error) {
    console.error("Exception lors de la création du client:", error);
    return null;
  }
};

/**
 * Update an existing client
 */
export const updateClient = async (
  clientId: string, 
  updates: Partial<Client>
): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;
    
    const { data: clientCheck } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', userId)
      .single();
    
    if (!clientCheck) {
      return false;
    }
    
    // Convert client object to database format
    const clientRecord = mapClientToClientRecord(updates);
    
    // Add updated_at timestamp
    const updateData = {
      ...clientRecord,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', clientId)
      .eq('user_id', userId);
    
    return !error;
  } catch (error) {
    console.error("Exception lors de la mise à jour du client:", error);
    return false;
  }
};

/**
 * Delete a client
 */
export const deleteClient = async (clientId: string): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;
    
    const { data: clientCheck } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', userId)
      .single();
    
    if (!clientCheck) {
      return false;
    }
    
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('user_id', userId);
    
    return !error;
  } catch (error) {
    console.error("Exception lors de la suppression du client:", error);
    return false;
  }
};
