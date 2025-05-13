
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
    
    // Ensure client has a name
    if (!client.name) {
      console.error("Client name is required");
      return null;
    }
    
    // Convert client object to database format
    const clientRecord = mapClientToClientRecord(client);
    
    // Create the insert data with user_id
    const insertData = {
      ...clientRecord,
      user_id: userId
    };
    
    // Since name is already validated above and in the mapper function,
    // we can be confident it exists in the insertData
    const { data, error } = await supabase
      .from('clients')
      .insert(insertData)
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
      .select('id, name')
      .eq('id', clientId)
      .eq('user_id', userId)
      .single();
    
    if (!clientCheck) {
      return false;
    }
    
    // Ensure we have a name for the update
    // If no name is provided in updates, use the existing name from clientCheck
    const updatesWithName = {
      ...updates,
      name: updates.name || clientCheck.name
    };
    
    // Convert client object to database format
    const clientRecord = mapClientToClientRecord(updatesWithName);
    
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
