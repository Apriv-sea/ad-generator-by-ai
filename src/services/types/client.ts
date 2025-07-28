
import { ClientRecord } from "@/types/supabase-extensions";

export interface Client {
  id: string;
  name: string;
  industry?: string;                // Nouveau: Secteur d'activité
  targetPersona?: string;           // Nouveau: Public/persona cible
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
