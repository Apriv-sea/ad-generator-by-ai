
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useAuthTokenHandler = () => {
  const navigate = useNavigate();
  const { isAuthenticated, processAuthTokens } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const processedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    const handleAuthTokens = async () => {
      // Prevent double processing and ensure component is mounted
      if (processedRef.current || !mountedRef.current) return;

      const hasHashToken = window.location.hash?.includes('access_token');
      
      if (hasHashToken) {
        console.log("Traitement des tokens d'authentification");
        processedRef.current = true;
        
        try {
          const processed = await processAuthTokens();
          if (!mountedRef.current) return;
          
          if (processed) {
            toast.success("Authentification réussie!");
            window.history.replaceState({}, document.title, window.location.pathname);
            navigate("/dashboard");
          } else {
            setAuthError("Échec du traitement du jeton d'authentification.");
          }
        } catch (error) {
          if (!mountedRef.current) return;
          console.error("Erreur lors du traitement des jetons:", error);
          setAuthError(`Erreur d'authentification: ${error instanceof Error ? error.message : String(error)}`);
        }
        return;
      }

      // Handle OAuth errors
      const urlParams = new URLSearchParams(location.search);
      const error = urlParams.get('error');
      if (error && !processedRef.current && mountedRef.current) {
        const errorDesc = urlParams.get('error_description');
        setAuthError(`Erreur d'authentification: ${error}. ${errorDesc || ''}`);
        processedRef.current = true;
      }
    };

    handleAuthTokens();

    return () => {
      mountedRef.current = false;
    };
  }, [processAuthTokens, navigate]);

  // Simple redirect for authenticated users
  useEffect(() => {
    if (isAuthenticated && !window.location.hash?.includes('access_token') && mountedRef.current) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return {
    authError,
    setAuthError
  };
};
