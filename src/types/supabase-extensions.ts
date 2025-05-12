
import { User } from "@supabase/supabase-js";

// Extending the User type from supabase to include additional properties
export interface ExtendedUser extends User {
  name?: string;
  picture?: string;
}

// Define types for our database tables that aren't in the auto-generated types
export interface ApiKey {
  id: string;
  user_id: string;
  service: string;
  api_key: string;
  created_at: string;
}

export interface ClientRecord {
  id: string;
  user_id: string;
  name: string;
  business_context: string | null;
  specifics: string | null;
  editorial_guidelines: string | null;
  created_at: string;
  updated_at: string;
}
