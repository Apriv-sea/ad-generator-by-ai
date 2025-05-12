
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  accessToken: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem('google_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = () => {
    // Configuration pour Google OAuth
    const googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const redirectUri = window.location.origin + "/auth/callback";
    
    // Il vous faudra obtenir un client_id en créant un projet dans la console Google Cloud
    // https://console.developers.google.com/
    const clientId = "VOTRE_CLIENT_ID";
    
    const scope = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/spreadsheets"
    ].join(" ");
    
    const params = {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "token",
      scope: scope,
      include_granted_scopes: "true",
      state: "pass-through-value"
    };
    
    const authUrl = `${googleAuthUrl}?${new URLSearchParams(params).toString()}`;
    
    // Rediriger vers la page d'authentification Google
    window.location.href = authUrl;
  };

  const logout = () => {
    localStorage.removeItem('google_user');
    localStorage.removeItem('google_connected');
    localStorage.removeItem('google_sheets_access');
    localStorage.removeItem('google_drive_access');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        login, 
        logout,
        isAuthenticated: !!user 
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
