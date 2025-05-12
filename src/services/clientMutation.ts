
import { supabase } from "@/integrations/supabase/client";
import { Client } from "./types/client";
import { getCurrentUserId, handleSupabaseError } from "./utils/supabaseUtils";
import { toast } from "sonner";

/**
 * Add a new client to the database
 */
export const addClient = async (
  client: Pick<Client, 'name' | 'businessContext' | 'specifics' | 'editorialGuidelines'>
): Promise<string | null> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;
    
    // Use type assertion to bypass TypeScript errors
    const { data, error } = await supabase
      .from('clients' as any)
      .insert({
        name: client.name,
        business_context: client.businessContext || "",
        specifics: client.specifics || "",
        editorial_guidelines: client.editorialGuidelines || "",
        user_id: userId
      } as any)
      .select('id')
      .single();
    
    if (error) {
      handleSupabaseError(error, "Erreur lors de l'ajout du client");
      return null;
    }
    
    toast.success(`Client ${client.name} ajouté avec succès`);
    return data?.id || null;
  } catch (error) {
    console.error("Exception lors de l'ajout du client:", error);
    toast.error("Une erreur est survenue lors de l'ajout du client");
    return null;
  }
};

/**
 * Update an existing client in the database
 */
export const updateClient = async (
  id: string,
  updates: Pick<Client, 'name' | 'businessContext' | 'specifics' | 'editorialGuidelines'>
): Promise<boolean> => {
  try {
    // Use type assertion to bypass TypeScript errors
    const { error } = await supabase
      .from('clients' as any)
      .update({
        name: updates.name,
        business_context: updates.businessContext || "",
        specifics: updates.specifics || "",
        editorial_guidelines: updates.editorialGuidelines || "",
        updated_at: new Date()
      } as any)
      .eq('id', id);
    
    if (error) {
      handleSupabaseError(error, "Erreur lors de la mise à jour du client");
      return false;
    }
    
    toast.success(`Client ${updates.name} mis à jour avec succès`);
    return true;
  } catch (error) {
    console.error("Exception lors de la mise à jour du client:", error);
    toast.error("Une erreur est survenue lors de la mise à jour du client");
    return false;
  }
};

/**
 * Delete a client from the database
 */
export const deleteClient = async (id: string, name: string): Promise<boolean> => {
  try {
    // Use type assertion to bypass TypeScript errors
    const { error } = await supabase
      .from('clients' as any)
      .delete()
      .eq('id', id);
    
    if (error) {
      handleSupabaseError(error, "Erreur lors de la suppression du client");
      return false;
    }
    
    toast.success(`Client ${name} supprimé avec succès`);
    return true;
  } catch (error) {
    console.error("Exception lors de la suppression du client:", error);
    toast.error("Une erreur est survenue lors de la suppression du client");
    return false;
  }
};
