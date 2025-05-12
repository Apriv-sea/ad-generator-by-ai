
import { supabase } from "@/integrations/supabase/client";
import { Client, ClientResponse } from "./types/client";
import { getCurrentUserId } from "./utils/supabaseUtils";

/**
 * Create a new client
 */
export const addClient = async (client: Partial<Client>): Promise<string | null> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;
    
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: client.name || '',
        business_context: client.businessContext || '',
        specifics: client.specifics || '',
        editorial_guidelines: client.editorialGuidelines || '',
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
    
    const { error } = await supabase
      .from('clients')
      .update({
        name: updates.name,
        business_context: updates.businessContext,
        specifics: updates.specifics,
        editorial_guidelines: updates.editorialGuidelines,
        updated_at: new Date()
      })
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
