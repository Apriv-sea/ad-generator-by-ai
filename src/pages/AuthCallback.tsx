
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import AuthCallbackContent from "@/components/auth/AuthCallbackContent";
import { extractUrlErrors } from "@/utils/authCallbackUtils";
import { processAuthTokens } from "@/utils/authUtils";

const AuthCallback: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [statusMessage, setStatusMessage] = useState('Traitement en cours...');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log("=== DEBUT TRAITEMENT CALLBACK ===");
        console.log("URL complète:", window.location.href);
        console.log("Pathname:", location.pathname);
        console.log("Search:", location.search);
        console.log("Hash:", location.hash);
        
        // Vérifier d'abord les erreurs dans les paramètres URL
        const { hasError, errorMessage } = extractUrlErrors();
        if (hasError && errorMessage) {
          console.error("Erreur détectée dans l'URL:", errorMessage);
          setStatus('error');
          setStatusMessage('Erreur d\'authentification détectée');
          setErrorDetails(errorMessage);
          setIsProcessing(false);
          return;
        }

        // Vérifier si c'est un callback d'authentification Supabase
        const hasSupabaseTokens = location.hash.includes('access_token');
        
        console.log("Type de callback détecté:", {
          hasSupabaseTokens
        });
        
        if (hasSupabaseTokens) {
          console.log("Traitement du callback Supabase standard");
          setStatusMessage('Traitement de l\'authentification...');
          
          // Process standard app authentication
          const success = await processAuthTokens();
          
          if (success) {
            console.log("Authentification standard réussie");
            setStatus('success');
            setStatusMessage('Authentification réussie !');
            // Rediriger vers le dashboard après un court délai
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          } else {
            console.error("Échec de l'authentification standard");
            setStatus('error');
            setStatusMessage('Échec de l\'authentification');
            setErrorDetails('Tokens d\'authentification manquants ou invalides');
          }
        } else {
          console.warn("Aucun paramètre d'authentification reconnu");
          setStatus('error');
          setStatusMessage('Paramètres d\'authentification manquants');
          setErrorDetails('Aucun token d\'authentification trouvé dans l\'URL');
        }
        
        setIsProcessing(false);
      } catch (error: any) {
        console.error("Erreur lors du traitement du callback:", error);
        setStatus('error');
        setStatusMessage('Erreur lors de l\'authentification');
        setErrorDetails(error.message || 'Une erreur inattendue s\'est produite');
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [navigate, location]);

  // Vérifier si un token est trouvé dans l'URL
  const isTokenFound = location.hash.includes('access_token') || 
                      location.search.includes('access_token');

  const redirectToRoot = () => {
    navigate('/');
  };

  return (
    <AuthCallbackContent
      status={{ type: status, message: statusMessage }}
      errorDetails={errorDetails}
      isTokenFound={isTokenFound}
      manualRedirectToRoot={redirectToRoot}
      isProcessing={isProcessing}
    />
  );
};

export default AuthCallback;
