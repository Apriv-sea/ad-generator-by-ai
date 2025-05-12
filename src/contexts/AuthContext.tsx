
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { processUserMetadata } from "@/utils/user-helpers";
import { ExtendedUser } from "@/types/supabase-extensions";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  googleLogin: () => Promise<void>;
  processAuthTokens: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fonction pour traiter les tokens dans l'URL
  const processAuthTokens = async (): Promise<boolean> => {
    console.log("Checking URL for authentication tokens...");
    
    if (window.location.hash && window.location.hash.includes('access_token')) {
      console.log("Found access token in URL hash");
      try {
        // Extraire les paramètres de l'URL
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
          toast.error("Erreur lors de l'authentification");
          return false;
        }
        
        if (data.session) {
          console.log("Session successfully established from URL token");
          setSession(data.session);
          setUser(processUserMetadata(data.session.user));
          
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
          
          toast.success("Connexion réussie!");
          
          return true;
        }
      } catch (error) {
        console.error("Error processing authentication from URL:", error);
      }
    }
    return false;
  };

  // Vérifier l'authentification au chargement
  useEffect(() => {
    let authSubscription: { unsubscribe: () => void } | null = null;
    
    const initAuth = async () => {
      // Vérifier d'abord si des tokens sont présents dans l'URL
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
      
      // Ne vérifions la session existante que si nous ne nous sommes pas déjà authentifiés via l'URL
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

  // Fonctions d'authentification
  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Connexion réussie");
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      toast.error(error.message || "Erreur de connexion");
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      toast.success("Inscription réussie. Veuillez vérifier votre email pour confirmer votre compte.");
    } catch (error: any) {
      console.error("Erreur d'inscription:", error);
      toast.error(error.message || "Erreur d'inscription");
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Nettoyage de localstorage
      localStorage.removeItem('google_user');
      localStorage.removeItem('google_connected');
      localStorage.removeItem('google_sheets_access');
      localStorage.removeItem('google_drive_access');
      toast.success("Déconnexion réussie");
    } catch (error: any) {
      console.error("Erreur de déconnexion:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const googleLogin = async () => {
    try {
      // Configuration pour Google OAuth via Supabase
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          scopes: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets'
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error("Erreur lors de la connexion avec Google:", error);
      toast.error("Erreur lors de la connexion à Google. Veuillez réessayer.");
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user,
        session,
        isLoading,
        login,
        signup,
        logout,
        googleLogin,
        isAuthenticated: !!session,
        processAuthTokens
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
