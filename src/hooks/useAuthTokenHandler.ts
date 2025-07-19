
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useAuthTokenHandler = () => {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthTokens = () => {
      const hasHashToken = window.location.hash?.includes('access_token');
      
      if (hasHashToken) {
        console.log("🔗 Processing auth tokens from URL");
        toast.success("Authentification réussie!");
        window.history.replaceState({}, document.title, window.location.pathname);
        // Ne plus rediriger automatiquement, laisser l'utilisateur sur la page actuelle
        return;
      }

      // Handle OAuth errors
      const urlParams = new URLSearchParams(location.search);
      const error = urlParams.get('error');
      if (error) {
        const errorDesc = urlParams.get('error_description');
        setAuthError(`Erreur d'authentification: ${error}. ${errorDesc || ''}`);
      }
    };

    handleAuthTokens();
  }, []);

  return {
    authError,
    setAuthError
  };
};
