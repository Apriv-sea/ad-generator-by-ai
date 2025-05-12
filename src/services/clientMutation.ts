
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ClientRecord } from "@/types/supabase-extensions";
import { Client, SingleClientResponse } from "./types/client";
import { getCurrentUserId, handleSupabaseError } from "./utils/supabaseUtils";

export const addClient = async (client: Omit<Client, 'id'>): Promise<Client | null> => {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      toast.error("Vous devez être connecté pour ajouter un client");
      return null;
    }

    // Using type assertion to handle the query
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: client.name,
        business_context: client.businessContext,
        specifics: client.specifics,
        editorial_guidelines: client.editorialGuidelines,
        user_id: userId
      })
      .select()
      .single() as unknown as SingleClientResponse;

    if (error) {
      handleSupabaseError(error, "Impossible d'ajouter le client");
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
    console.error("Exception lors de l'ajout du client:", error);
    toast.error("Une erreur s'est produite lors de l'ajout du client");
    return null;
  }
};

export const updateClient = async (client: Client): Promise<boolean> => {
  try {
    // Using type assertion to handle the query
    const { error } = await supabase
      .from('clients')
      .update({
        name: client.name,
        business_context: client.businessContext,
        specifics: client.specifics,
        editorial_guidelines: client.editorialGuidelines,
        updated_at: new Date()
      })
      .eq('id', client.id) as unknown as { error: Error | null };

    if (error) {
      handleSupabaseError(error, "Impossible de mettre à jour le client");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception lors de la mise à jour du client:", error);
    toast.error("Une erreur s'est produite lors de la mise à jour du client");
    return false;
  }
};

export const deleteClient = async (clientId: string): Promise<boolean> => {
  try {
    // Using type assertion to handle the query
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId) as unknown as { error: Error | null };

    if (error) {
      handleSupabaseError(error, "Impossible de supprimer le client");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception lors de la suppression du client:", error);
    toast.error("Une erreur s'est produite lors de la suppression du client");
    return false;
  }
};
