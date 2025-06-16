
import { toast } from "sonner";

// Legacy function - deprecated for security reasons
// Use server-side edge functions for API calls instead
export const getUserAccessToken = (): string | null => {
  console.warn("🚨 getUserAccessToken is deprecated for security reasons. Use server-side edge functions instead.");
  toast.error("Cette fonctionnalité a été désactivée pour des raisons de sécurité");
  return null;
};

// Utility function to check if user is authenticated
export const isUserAuthenticated = async (): Promise<boolean> => {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: { session }, error } = await supabase.auth.getSession();
    return !error && !!session;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
};

// Utility function to get current user safely
export const getCurrentUser = async () => {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};
