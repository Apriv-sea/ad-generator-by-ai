
import { Client } from "../types/client";
import { ClientRecord } from "@/types/supabase-extensions";

/**
 * Maps a ClientRecord from the database (snake_case) to a Client object (camelCase)
 */
export function mapClientRecordToClient(record: ClientRecord): Client {
  return {
    id: record.id,
    name: record.name,
    businessContext: record.business_context || undefined,
    specifics: record.specifics || undefined,
    editorialGuidelines: record.editorial_guidelines || undefined
  };
}

/**
 * Maps a Client object (camelCase) to a ClientRecord for database operations (snake_case)
 * Ensures that required fields are present
 */
export function mapClientToClientRecord(client: Partial<Client>): Partial<ClientRecord> & { name: string } {
  // Validate required fields
  if (!client.name) {
    throw new Error("Client name is required");
  }
  
  const result: Partial<ClientRecord> & { name: string } = {
    // Explicitly include name as it's required by the database
    name: client.name,
  };
  
  if (client.id !== undefined) result.id = client.id;
  if (client.businessContext !== undefined) result.business_context = client.businessContext;
  if (client.specifics !== undefined) result.specifics = client.specifics;
  if (client.editorialGuidelines !== undefined) result.editorial_guidelines = client.editorialGuidelines;
  
  return result;
}
