
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Initiates email authentication login through Supabase
 */
export const initiateEmailLogin = async (): Promise<void> => {
  try {
    console.log("Initiating email authentication");
    
    // Get the current URL origin for redirect
    const redirectUrl = window.location.origin + '/auth/callback';
    console.log("Using redirect URL:", redirectUrl);
    
    // Configuration for email OAuth via Supabase with basic scopes only
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: redirectUrl,
        scopes: 'email profile openid',
      }
    });
    
    if (error) throw error;
    console.log("Email authentication initiation successful");
  } catch (error: any) {
    console.error("Error connecting:", error);
    toast.error("Error connecting. Please try again.");
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
