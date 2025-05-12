
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AuthCallbackContent from "@/components/auth/AuthCallbackContent";
import { checkForAuthErrors, checkForToken, manuallySetSession } from "@/utils/authCallbackUtils";

const AuthCallback = () => {
  const [status, setStatus] = useState<string>("Traitement de l'authentification...");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isTokenFound, setIsTokenFound] = useState<boolean>(false);
  const navigate = useNavigate();
  const { processAuthTokens } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("Processing authentication callback...");
        
        // Check URL for errors
        const urlParams = new URLSearchParams(window.location.search);
        const authError = checkForAuthErrors(urlParams);
        
        if (authError) {
          setStatus(`Erreur d'authentification: ${authError.error}`);
          setErrorDetails(authError.errorDescription);
          toast.error(`Échec de l'authentification: ${authError.error}`);
          setTimeout(() => navigate("/auth"), 5000);
          return;
        }

        // Check if session exists already (case where token was processed by AuthContext)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Session already exists, redirecting to dashboard");
          toast.success("Connexion réussie!");
          setTimeout(() => navigate("/dashboard"), 1000);
          return;
        }
        
        // Check for access_token in URL hash or as a standalone JWT
        const { accessToken, refreshToken, isTokenFound: tokenFound } = checkForToken();
        setIsTokenFound(tokenFound);
        
        if (accessToken) {
          console.log("Access token found, attempting to set session...");
          
          try {
            // Try to process token using the centralized function first
            const tokenProcessed = await processAuthTokens();
            
            if (tokenProcessed) {
              console.log("Token processed successfully through AuthContext");
              toast.success("Connexion réussie!");
              setStatus("Authentification réussie! Redirection...");
              
              // Clean the URL
              window.history.replaceState({}, document.title, window.location.pathname);
              
              setTimeout(() => navigate("/dashboard"), 1000);
              return;
            }
            
            // Fallback to manual token processing if the above fails
            const sessionEstablished = await manuallySetSession(accessToken, refreshToken);
            
            if (sessionEstablished) {
              setStatus("Authentification réussie! Redirection...");
              setTimeout(() => navigate("/dashboard"), 1000);
              return;
            }
          } catch (tokenError) {
            console.error("Error processing token:", tokenError);
            setErrorDetails(String(tokenError));
          }
        } else {
          setStatus("Aucun jeton d'authentification trouvé dans l'URL");
          setErrorDetails("Le processus d'authentification n'a pas généré de jeton valide. Vérifiez la configuration OAuth.");
        }
        
        // If we get here, authentication failed
        if (!isTokenFound) {
          setStatus("Échec de l'authentification");
          setErrorDetails("Impossible de récupérer les informations de session");
          toast.error("Échec de l'authentification");
          setTimeout(() => navigate("/auth"), 5000);
        }
      } catch (error) {
        console.error("Authentication error:", error);
        setStatus("Une erreur est survenue");
        setErrorDetails(error instanceof Error ? error.message : "Erreur inconnue");
        toast.error("Échec de l'authentification");
        setTimeout(() => navigate("/auth"), 5000);
      }
    };

    handleCallback();
  }, [navigate, processAuthTokens, isTokenFound]);

  const manualRedirectToRoot = () => {
    // Copy token information to the root URL
    if (window.location.hash && window.location.hash.includes('access_token')) {
      const rootUrl = window.location.origin + '/' + window.location.hash;
      window.location.href = rootUrl;
    } else {
      navigate("/");
    }
  };

  return (
    <AuthCallbackContent
      status={status}
      errorDetails={errorDetails}
      isTokenFound={isTokenFound}
      manualRedirectToRoot={manualRedirectToRoot}
    />
  );
};

export default AuthCallback;
