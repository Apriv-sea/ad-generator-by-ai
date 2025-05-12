
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Initiates Google OAuth login through Supabase
 */
export const initiateGoogleLogin = async (): Promise<void> => {
  try {
    console.log("Initiating Google OAuth login");
    
    // Get the current URL origin for redirect
    const redirectUrl = window.location.origin + '/auth/callback';
    console.log("Using redirect URL:", redirectUrl);
    
    // Configuration for Google OAuth via Supabase with debugging
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        scopes: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    
    if (error) throw error;
    console.log("Google OAuth initiation successful");
  } catch (error: any) {
    console.error("Error connecting with Google:", error);
    toast.error("Error connecting to Google. Please try again.");
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
        if (data.session.user?.app_metadata?.provider === 'google') {
          localStorage.setItem("google_connected", "true");
          
          // Store Google user info
          const userData = {
            provider: 'google',
            email: data.session.user.email,
            name: data.session.user?.user_metadata?.full_name || data.session.user.email,
            picture: data.session.user?.user_metadata?.picture || data.session.user?.user_metadata?.avatar_url
          };
          
          localStorage.setItem("google_user", JSON.stringify(userData));
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
