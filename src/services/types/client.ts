
import { ClientRecord } from "@/types/supabase-extensions";

export interface Client {
  id: string;
  name: string;
  industry?: string;                // Nouveau: Secteur d'activité
  targetPersona?: string;           // Nouveau: Public/persona cible
  businessContext?: string;
  specifics?: string;
  editorialGuidelines?: string;
  forbiddenTerms?: string[];        // NOUVEAU: Termes interdits
  forbiddenPhrases?: string[];      // NOUVEAU: Expressions interdites
  forbiddenTones?: string[];        // NOUVEAU: Tons proscrits
  mandatoryTerms?: string[];        // NOUVEAU: Termes privilégiés
  constraintPriority?: 'low' | 'medium' | 'high' | 'critical'; // NOUVEAU: Priorité contraintes
}

export interface ClientResponse {
  data: Client[] | null;
  error: Error | null;
}

export interface SingleClientResponse {
  data: Client | null;
  error: Error | null;
}
