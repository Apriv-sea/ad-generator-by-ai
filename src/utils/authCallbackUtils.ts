
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Check URL for authentication errors
export const checkForAuthErrors = (urlParams: URLSearchParams) => {
  const error = urlParams.get("error");
  if (error) {
    console.error("OAuth error:", error);
    const errorDescription = urlParams.get("error_description") || "Aucune description disponible";
    return { error, errorDescription };
  }
  return null;
};

// Check for token in URL hash or pathname
export const checkForToken = () => {
  let accessToken = null;
  let refreshToken = null;
  let isTokenFound = false;
  
  // Check if we have a hash fragment with tokens
  if (window.location.hash) {
    console.log("Hash fragment detected in URL");
    isTokenFound = true;
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    accessToken = hashParams.get('access_token');
    refreshToken = hashParams.get('refresh_token');
    
    if (accessToken) {
      console.log("Access token found in hash");
    } else {
      console.log("No access token in hash despite hash being present");
    }
  } 
  // If no access token in hash, check if the URL itself is a JWT token
  else if (window.location.pathname.length > 20 && window.location.pathname.includes('.')) {
    console.log("URL appears to be a JWT token, extracting...");
    isTokenFound = true;
    accessToken = window.location.pathname.substring(1); // Remove leading slash
  }
  
  return { accessToken, refreshToken, isTokenFound };
};

// Handle manual token setting when processAuthTokens fails
export const manuallySetSession = async (accessToken: string, refreshToken: string | null) => {
  try {
    console.log("Attempting to manually set session with token");
    
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || ''
    });
    
    if (error) {
      console.error("Error setting session:", error);
      throw error;
    }
    
    if (data.session) {
      console.log("Session successfully established manually");
      
      // Store user preferences
      if (data.session.user) {
        localStorage.setItem("auth_connected", "true");
        
        // Store user info
        const userData = {
          email: data.session.user.email,
          name: data.session.user?.user_metadata?.full_name || data.session.user.email,
          picture: data.session.user?.user_metadata?.picture || data.session.user?.user_metadata?.avatar_url
        };
        
        localStorage.setItem("user_data", JSON.stringify(userData));
      }
      
      toast.success("Connexion réussie!");
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      return true;
    }
  } catch (error) {
    console.error("Error manually setting session:", error);
    throw error;
  }
  
  return false;
};
