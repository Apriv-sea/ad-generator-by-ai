
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useAuthTokenHandler = () => {
  const navigate = useNavigate();
  const { isAuthenticated, processAuthTokens } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    const handleAuthTokens = async () => {
      // Éviter le double traitement
      if (processedRef.current) return;

      const hasHashToken = window.location.hash?.includes('access_token');
      
      // Traitement des tokens uniquement s'ils sont présents
      if (hasHashToken) {
        console.log("Traitement des tokens d'authentification");
        processedRef.current = true;
        
        try {
          const processed = await processAuthTokens();
          if (processed) {
            toast.success("Authentification réussie!");
            window.history.replaceState({}, document.title, window.location.pathname);
            navigate("/dashboard");
          } else {
            setAuthError("Échec du traitement du jeton d'authentification.");
          }
        } catch (error) {
          console.error("Erreur lors du traitement des jetons:", error);
          setAuthError(`Erreur d'authentification: ${error instanceof Error ? error.message : String(error)}`);
        }
        return;
      }

      // Gestion des erreurs OAuth
      const urlParams = new URLSearchParams(location.search);
      const error = urlParams.get('error');
      if (error && !processedRef.current) {
        const errorDesc = urlParams.get('error_description');
        setAuthError(`Erreur d'authentification: ${error}. ${errorDesc || ''}`);
        processedRef.current = true;
      }
    };

    handleAuthTokens();
  }, [processAuthTokens, navigate]);

  // Redirection simple pour les utilisateurs authentifiés
  useEffect(() => {
    if (isAuthenticated && !window.location.hash?.includes('access_token')) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return {
    authError,
    setAuthError
  };
};
