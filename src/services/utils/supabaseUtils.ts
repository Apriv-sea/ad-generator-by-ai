
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Helper for retrieving the user's access token
export const getUserAccessToken = () => {
  const user = localStorage.getItem('google_user');
  if (!user) return null;
  
  try {
    const userData = JSON.parse(user);
    return userData.accessToken;
  } catch (error) {
    console.error("Erreur lors de la récupération du token d'accès:", error);
    return null;
  }
};

// Helper to get current user ID
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const user = await supabase.auth.getUser();
    return user.data.user?.id || null;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'ID utilisateur:", error);
    return null;
  }
};

// Generic error handler for Supabase operations
export const handleSupabaseError = (error: Error | null, message: string): void => {
  if (error) {
    console.error(`${message}:`, error);
    toast.error(message);
  }
};
