
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuthCallbackProcessor } from "@/hooks/useAuthCallbackProcessor";
import GoogleCallbackContent from "@/components/auth/GoogleCallbackContent";
import AuthCallbackContent from "@/components/auth/AuthCallbackContent";
import { extractUrlErrors } from "@/utils/authCallbackUtils";

const AuthCallback: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    status,
    statusMessage,
    errorDetails,
    processStandardAuth,
    processGoogleSheetsAuth,
    checkForErrors,
    redirectToRoot,
    goBack
  } = useAuthCallbackProcessor();

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
          setIsProcessing(false);
          return;
        }

        // Détecter le type de callback en analysant les paramètres
        const urlParams = new URLSearchParams(location.search);
        const hasGoogleParams = urlParams.has('code') && urlParams.has('state');
        const hasSupabaseTokens = location.hash.includes('access_token');
        
        console.log("Type de callback détecté:", {
          hasGoogleParams,
          hasSupabaseTokens,
          code: urlParams.get('code'),
          state: urlParams.get('state')
        });
        
        if (hasGoogleParams) {
          console.log("Traitement du callback Google Sheets");
          // Process Google Sheets authentication
          const success = processGoogleSheetsAuth();
          
          if (success) {
            // Rediriger vers la page précédente après un court délai
            setTimeout(() => {
              navigate(-1);
            }, 1500);
          }
        } else if (hasSupabaseTokens) {
          console.log("Traitement du callback Supabase standard");
          // Process standard app authentication
          const success = await processStandardAuth();
          
          if (success) {
            // Rediriger vers le dashboard après un court délai
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          }
        } else {
          console.warn("Aucun paramètre d'authentification reconnu");
          setIsProcessing(false);
        }
        
        setIsProcessing(false);
      } catch (error: any) {
        console.error("Erreur lors du traitement du callback:", error);
        toast.error("Erreur lors du traitement de l'authentification");
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [navigate, location, processStandardAuth, processGoogleSheetsAuth]);

  // Déterminer si on traite un callback Google
  const urlParams = new URLSearchParams(location.search);
  const isGoogleCallback = urlParams.has('code') && urlParams.has('state');
  
  // Vérifier si un token est trouvé dans l'URL
  const isTokenFound = location.hash.includes('access_token') || 
                      location.search.includes('access_token') ||
                      isGoogleCallback;

  console.log("Rendu du composant:", {
    isGoogleCallback,
    isTokenFound,
    status,
    isProcessing
  });

  return (
    <>
      {isGoogleCallback ? (
        <GoogleCallbackContent 
          status={{ type: status, message: statusMessage }}
          errorDetails={errorDetails}
          goBack={goBack}
        />
      ) : (
        <AuthCallbackContent
          status={{ type: status, message: statusMessage }}
          errorDetails={errorDetails}
          isTokenFound={isTokenFound}
          manualRedirectToRoot={redirectToRoot}
          isProcessing={isProcessing}
        />
      )}
    </>
  );
};

export default AuthCallback;
