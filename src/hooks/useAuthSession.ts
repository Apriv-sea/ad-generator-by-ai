
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { processUserMetadata } from "@/utils/user-helpers";
import { processAuthTokens } from "@/utils/googleAuthUtils";

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize authentication
  useEffect(() => {
    let authSubscription: { unsubscribe: () => void } | null = null;
    
    const initAuth = async () => {
      // First check if tokens are present in the URL
      const authenticatedFromUrl = await processAuthTokens();
      
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log("Auth state changed:", event);
          setSession(session);
          // Process the user to extract additional metadata like name and picture
          const processedUser = session?.user ? processUserMetadata(session.user) : null;
          setUser(processedUser);
          
          // Update Google connection status in localStorage based on auth events
          if (event === 'SIGNED_IN' && session?.user?.app_metadata?.provider === 'google') {
            localStorage.setItem('google_connected', 'true');
            
            // Store user data for Google authenticated users
            if (session.user) {
              const userData = {
                provider: 'google',
                email: session.user.email,
                name: session.user?.user_metadata?.full_name || session.user.email,
                picture: session.user?.user_metadata?.picture || session.user?.user_metadata?.avatar_url
              };
              
              localStorage.setItem("google_user", JSON.stringify(userData));
            }
          } else if (event === 'SIGNED_OUT') {
            localStorage.removeItem('google_connected');
            localStorage.removeItem('google_user');
            localStorage.removeItem('google_sheets_access');
            localStorage.removeItem('google_drive_access');
          }
        }
      );
      
      authSubscription = subscription;
      
      // Only check for existing session if we didn't already authenticate via URL
      if (!authenticatedFromUrl) {
        // THEN check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Initial session check:", session ? "Session found" : "No session");
        setSession(session);
        // Process the user to extract additional metadata like name and picture
        const processedUser = session?.user ? processUserMetadata(session.user) : null;
        setUser(processedUser);
        
        // Initialize Google connection status if not set already
        if (session?.user?.app_metadata?.provider === 'google') {
          localStorage.setItem('google_connected', 'true');
          
          // Ensure we have user data stored
          if (!localStorage.getItem('google_user') && session.user) {
            const userData = {
              provider: 'google',
              email: session.user.email,
              name: session.user?.user_metadata?.full_name || session.user.email,
              picture: session.user?.user_metadata?.picture || session.user?.user_metadata?.avatar_url
            };
            
            localStorage.setItem("google_user", JSON.stringify(userData));
          }
        }
      }
      
      setIsLoading(false);
    };

    initAuth().catch(error => {
      console.error("Error initializing authentication:", error);
      setIsLoading(false);
    });

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
  };
}
