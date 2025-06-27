
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useAuthTokenHandler = () => {
  const navigate = useNavigate();
  const { isAuthenticated, processAuthTokens } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [processingAuth, setProcessingAuth] = useState(false);
  const processedRef = useRef(false);

  useEffect(() => {
    const handleAuthTokens = async () => {
      // Éviter le double traitement
      if (processedRef.current) return;

      const hasHashToken = window.location.hash?.includes('access_token');
      const isLocalhost = window.location.hostname === 'localhost';
      
      // Redirection localhost
      if (isLocalhost && hasHashToken) {
        console.log("Redirection vers localhost-redirect");
        navigate('/localhost-redirect');
        return;
      }

      // Traitement des tokens
      if (hasHashToken) {
        console.log("Traitement des tokens d'authentification");
        processedRef.current = true;
        setProcessingAuth(true);
        
        try {
          const processed = await processAuthTokens();
          if (processed) {
            toast.success("Authentification réussie!");
            window.history.replaceState({}, document.title, window.location.pathname);
            setTimeout(() => {
              if (isAuthenticated) {
                navigate("/dashboard");
              }
            }, 1000);
          } else {
            setAuthError("Échec du traitement du jeton d'authentification.");
          }
        } catch (error) {
          console.error("Erreur lors du traitement des jetons:", error);
          setAuthError(`Erreur d'authentification: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
          setProcessingAuth(false);
        }
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
  }, []); // Pas de dépendances pour éviter les re-exécutions

  // Redirection des utilisateurs authentifiés
  useEffect(() => {
    if (isAuthenticated && !processingAuth && !window.location.hash?.includes('access_token')) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, processingAuth, navigate]);

  return {
    authError,
    processingAuth,
    setAuthError
  };
};
