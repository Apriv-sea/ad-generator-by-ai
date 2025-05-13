
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
    
    // Convert client object to database format with required name field
    const clientRecord = mapClientToClientRecord({
      ...client,
      name: client.name // Ensure name is explicitly passed
    });
    
    // Create the insert data with user_id
    const insertData = {
      ...clientRecord,
      user_id: userId
    };
    
    // Now insertData.name is definitely not undefined because:
    // 1. We checked client.name above
    // 2. mapClientToClientRecord throws if name is missing
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
    
    // Get existing client to ensure we have a name
    const { data: clientCheck } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .eq('user_id', userId)
      .single();
    
    if (!clientCheck) {
      return false;
    }
    
    // Ensure we have a name for the update by using the existing name if not provided
    const updatesWithName: Partial<Client> = {
      ...updates,
      name: updates.name || clientCheck.name
    };
    
    // Convert client object to database format (now with guaranteed name field)
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
