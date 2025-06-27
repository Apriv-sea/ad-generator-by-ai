
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useAuthTokenHandler = () => {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);
  const processedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    const handleAuthTokens = () => {
      // Prevent double processing
      if (processedRef.current || !mountedRef.current) return;

      const hasHashToken = window.location.hash?.includes('access_token');
      
      if (hasHashToken) {
        console.log("🔗 Processing auth tokens from URL");
        processedRef.current = true;
        
        // Simple success handling - let the auth context handle the actual processing
        toast.success("Authentification réussie!");
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate("/dashboard");
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
  }, []); // Empty dependency array to prevent loops

  return {
    authError,
    setAuthError
  };
};
