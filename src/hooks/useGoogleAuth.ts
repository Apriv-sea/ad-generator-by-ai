
import { useState, useEffect } from 'react';
import { googleAuthService } from '@/services/google/googleAuthService';
import { toast } from 'sonner';

interface GoogleAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userInfo: { email: string; scopes: string[] } | null;
  error: string | null;
}

export function useGoogleAuth() {
  const [state, setState] = useState<GoogleAuthState>({
    isAuthenticated: false,
    isLoading: true,
    userInfo: null,
    error: null
  });

  // Vérifier l'état d'authentification au chargement
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const isAuth = await googleAuthService.isAuthenticated();
      const userInfo = isAuth ? googleAuthService.getAuthenticatedUser() : null;
      
      setState({
        isAuthenticated: isAuth,
        isLoading: false,
        userInfo,
        error: null
      });
    } catch (error) {
      console.error("Erreur lors de la vérification de l'authentification:", error);
      setState({
        isAuthenticated: false,
        isLoading: false,
        userInfo: null,
        error: error.message || "Erreur lors de la vérification de l'authentification"
      });
    }
  };

  const signIn = () => {
    try {
      googleAuthService.initiateAuth();
    } catch (error) {
      console.error("Erreur lors de l'initiation de l'authentification:", error);
      toast.error("Erreur lors de l'initiation de la connexion");
    }
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await googleAuthService.signOut();
      setState({
        isAuthenticated: false,
        isLoading: false,
        userInfo: null,
        error: null
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error.message || "Erreur lors de la déconnexion"
      }));
    }
  };

  const refreshAuth = () => {
    checkAuthStatus();
  };

  const getAccessToken = async (): Promise<string | null> => {
    try {
      return await googleAuthService.getValidAccessToken();
    } catch (error) {
      console.error("Erreur lors de la récupération du token:", error);
      setState(prev => ({ 
        ...prev, 
        error: "Session expirée, veuillez vous reconnecter",
        isAuthenticated: false,
        userInfo: null
      }));
      return null;
    }
  };

  return {
    ...state,
    signIn,
    signOut,
    refreshAuth,
    getAccessToken
  };
}
