
import { supabase } from "@/integrations/supabase/client";
import { Client, ClientResponse, SingleClientResponse } from "./types/client";
import { mapClientRecordToClient } from "./mappers/clientMapper";
import { ClientRecord } from "@/types/supabase-extensions";

/**
 * Get all clients for the current user
 */
export const getClients = async (): Promise<ClientResponse> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return { data: null, error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');
    
    if (error) {
      console.error("Error fetching clients:", error);
      return { data: null, error };
    }

    // Map ClientRecord objects to Client objects
    const clients = data.map(record => mapClientRecordToClient(record as ClientRecord));
    
    return { data: clients, error: null };
  } catch (error) {
    console.error("Exception in getClients:", error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get a specific client by ID
 */
export const getClientById = async (clientId: string): Promise<SingleClientResponse> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return { data: null, error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (error) {
      console.error("Error fetching client:", error);
      return { data: null, error };
    }

    const client = mapClientRecordToClient(data as ClientRecord);
    
    return { data: client, error: null };
  } catch (error) {
    console.error("Exception in getClientById:", error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get short info for a client (used for select dropdowns)
 */
export const getClientInfo = async (clientId: string | undefined): Promise<Client | null> => {
  try {
    if (!clientId) return null;
    
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return null;

    const { data, error } = await supabase
      .from('clients')
      .select('id, name, business_context, specifics, editorial_guidelines')
      .eq('id', clientId)
      .single();
    
    if (error || !data) {
      console.error("Error fetching client info:", error);
      return null;
    }
    
    // Use the mapper function to convert to Client format
    return mapClientRecordToClient(data as ClientRecord);
  } catch (error) {
    console.error("Exception in getClientInfo:", error);
    return null;
  }
};

/**
 * Get all clients with minimal info
 */
export const getClientShortInfo = async (): Promise<Client[]> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return [];

    const { data, error } = await supabase
      .from('clients')
      .select('id, name, business_context')
      .order('name');
    
    if (error || !data) {
      console.error("Error fetching clients short info:", error);
      return [];
    }
    
    // Map the data to Client objects using the mapper function
    return data.map(record => mapClientRecordToClient({
      id: record.id,
      name: record.name,
      business_context: record.business_context,
      specifics: null,
      editorial_guidelines: null,
      user_id: '', // These fields are required for the ClientRecord type
      created_at: '',
      updated_at: ''
    } as ClientRecord));
  } catch (error) {
    console.error("Exception in getClientShortInfo:", error);
    return [];
  }
};
