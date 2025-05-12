
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    // Set up auth state listener FIRST
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
          if (!localStorage.getItem('google_user') && session.user) {
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

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
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
      
      setIsLoading(false);
    }).catch(error => {
      console.error("Error checking session:", error);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
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
        isAuthenticated: !!session
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
