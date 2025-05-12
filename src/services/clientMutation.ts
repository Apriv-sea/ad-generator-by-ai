
import { supabase } from "@/integrations/supabase/client";
import { Client, ClientResponse } from "./types/client";
import { getCurrentUserId } from "./utils/supabaseUtils";

/**
 * Create a new client
 */
export const createClient = async (
  name: string,
  businessContext: string,
  specifics: string,
  editorialGuidelines: string
): Promise<ClientResponse> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { data: null, error: new Error("User not authenticated") };
    
    const { data, error } = await supabase
      .from('clients' as any)
      .insert({
        name: name,
        business_context: businessContext,
        specifics: specifics,
        editorial_guidelines: editorialGuidelines,
        user_id: userId
      } as any)
      .select();
    
    return { data, error };
  } catch (error) {
    console.error("Exception lors de la création du client:", error);
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

/**
 * Update an existing client
 */
export const updateClient = async (
  clientId: string,
  name: string,
  businessContext: string,
  specifics: string,
  editorialGuidelines: string
): Promise<ClientResponse> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { data: null, error: new Error("User not authenticated") };
    
    // First, check if this client belongs to the user
    const { data: clientCheck } = await supabase
      .from('clients' as any)
      .select('id')
      .eq('id', clientId)
      .eq('user_id', userId)
      .single();
    
    if (!clientCheck) {
      return { data: null, error: new Error("Client not found or access denied") };
    }
    
    const { data, error } = await supabase
      .from('clients' as any)
      .update({
        name: name,
        business_context: businessContext,
        specifics: specifics,
        editorial_guidelines: editorialGuidelines,
        updated_at: new Date()
      } as any)
      .eq('id', clientId)
      .eq('user_id', userId)
      .select();
    
    return { data, error };
  } catch (error) {
    console.error("Exception lors de la mise à jour du client:", error);
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

/**
 * Delete a client
 */
export const deleteClient = async (clientId: string): Promise<{ success: boolean; error: Error | null }> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: new Error("User not authenticated") };
    
    // First, check if this client belongs to the user
    const { data: clientCheck } = await supabase
      .from('clients' as any)
      .select('id')
      .eq('id', clientId)
      .eq('user_id', userId)
      .single();
    
    if (!clientCheck) {
      return { success: false, error: new Error("Client not found or access denied") };
    }
    
    const { error } = await supabase
      .from('clients' as any)
      .delete()
      .eq('id', clientId)
      .eq('user_id', userId);
    
    if (error) {
      return { success: false, error };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error("Exception lors de la suppression du client:", error);
    return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};
