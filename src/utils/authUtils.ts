
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Initiates email authentication login through Supabase magic link
 */
export const initiateEmailLogin = async (email?: string): Promise<void> => {
  try {
    console.log("Initiating email magic link authentication");
    
    if (!email) {
      // If no email is provided, show a prompt to get it
      const emailInput = prompt("Veuillez entrer votre adresse email pour recevoir un lien de connexion");
      
      if (!emailInput) {
        toast.error("Adresse email requise pour la connexion");
        return;
      }
      
      email = emailInput;
    }
    
    // Get the current URL origin for redirect
    const redirectUrl = window.location.origin + '/auth/callback';
    console.log("Using redirect URL:", redirectUrl);
    
    // Configuration for magic link via Supabase
    const { error, data } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (error) throw error;
    
    console.log("Magic link email sent successfully");
    toast.success("Un email avec un lien de connexion a été envoyé à votre adresse email");
  } catch (error: any) {
    console.error("Error sending magic link:", error);
    toast.error(error.message || "Erreur lors de l'envoi du lien de connexion. Veuillez réessayer.");
  }
};

/**
 * Process tokens from URL and set up session
 */
export const processAuthTokens = async (): Promise<boolean> => {
  console.log("Checking URL for authentication tokens...");
  
  if (window.location.hash && window.location.hash.includes('access_token')) {
    console.log("Found access token in URL hash");
    try {
      // Extract URL parameters
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || '';
      
      if (!accessToken) {
        console.error("Access token not found in URL hash");
        return false;
      }
      
      console.log("Setting session with token from URL...");
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      
      if (error) {
        console.error("Error setting session with token:", error);
        toast.error("Authentication error");
        return false;
      }
      
      if (data.session) {
        console.log("Session successfully established from URL token");
        
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
        
        toast.success("Connection successful!");
        
        return true;
      }
    } catch (error) {
      console.error("Error processing authentication from URL:", error);
    }
  }
  return false;
};
