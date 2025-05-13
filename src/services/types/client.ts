
import { ClientRecord } from "@/types/supabase-extensions";

export interface Client {
  id: string;
  name: string;
  businessContext?: string;
  specifics?: string;
  editorialGuidelines?: string;
}

export interface ClientResponse {
  data: Client[] | null;
  error: Error | null;
}

export interface SingleClientResponse {
  data: Client | null;
  error: Error | null;
}
