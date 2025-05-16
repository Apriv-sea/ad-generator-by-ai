
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { processAuthTokens } from "@/utils/authUtils";

type AuthStatus = "processing" | "success" | "error";

export const useAuthCallbackProcessor = () => {
  const [status, setStatus] = useState<AuthStatus>("processing");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Function to handle standard app authentication callback
  const processStandardAuth = async (): Promise<boolean> => {
    try {
      const success = await processAuthTokens();
      if (success) {
        setStatus("success");
        return true;
      } else {
        setStatus("error");
        setErrorDetails("Aucun jeton d'authentification trouvé dans l'URL.");
        return false;
      }
    } catch (error: any) {
      console.error("Erreur lors du traitement de l'authentification standard:", error);
      setStatus("error");
      setErrorDetails(error.message || "Une erreur s'est produite");
      return false;
    }
  };

  // Function to handle Google Sheets authentication callback
  const processGoogleSheetsAuth = (): boolean => {
    try {
      // Extract URL parameters from hash for OAuth2 implicit grant
      const fragment = window.location.hash.substring(1);
      const params = new URLSearchParams(fragment);
      
      const accessToken = params.get('access_token');
      const expiresIn = params.get('expires_in');
      const state = params.get('state');
      
      // Verify that the state matches the one stored
      const savedState = localStorage.getItem('google_auth_state');
      
      console.log("Saved state:", savedState);
      console.log("Received state:", state);
      
      if (!accessToken) {
        console.error("Erreur d'authentification: token manquant");
        setStatus("error");
        setErrorDetails("Token manquant. Veuillez réessayer l'authentification.");
        toast.error("Échec de l'authentification Google");
        return false;
      }
      
      if (!state || !savedState) {
        console.error("Erreur d'authentification: état manquant");
        setStatus("error");
        setErrorDetails("État de sécurité manquant. Veuillez vider le cache du navigateur et réessayer l'authentification.");
        toast.error("Échec de l'authentification Google");
        return false;
      }
      
      if (state !== savedState) {
        console.error("Erreur d'authentification: état non valide");
        setStatus("error");
        setErrorDetails(`État de sécurité non valide. Reçu: ${state}, Attendu: ${savedState}. Veuillez réessayer l'authentification.`);
        toast.error("Échec de l'authentification Google - Problème de sécurité");
        return false;
      }
      
      // Store the access token
      localStorage.setItem('google_access_token', accessToken);
      localStorage.removeItem('google_auth_state'); // Clean up the state
      
      // Calculate the expiration date
      if (expiresIn) {
        const expiryTime = new Date().getTime() + parseInt(expiresIn) * 1000;
        localStorage.setItem('google_token_expiry', expiryTime.toString());
      }
      
      setStatus("success");
      toast.success("Authentification Google réussie");
      return true;
    } catch (error: any) {
      console.error("Erreur lors du traitement du callback Google:", error);
      setStatus("error");
      setErrorDetails(error.message || "Une erreur s'est produite lors de l'authentification Google Sheets");
      return false;
    }
  };

  // Check for errors in URL parameters
  const checkForErrors = (): boolean => {
    const searchParams = new URLSearchParams(location.search);
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      setStatus("error");
      let errorMessage = `Erreur: ${error}`;
      if (errorDescription) {
        errorMessage += `\nDescription: ${errorDescription}`;
      }
      
      // Handle specific error for redirect URI mismatch
      if (error === 'redirect_uri_mismatch') {
        errorMessage += `\n\nL'URI de redirection utilisée ne correspond pas à celles configurées dans votre console Google Cloud.\n`;
        errorMessage += `URI attendue pour l'environnement actuel: ${window.location.origin}/auth/callback/google\n`;
        errorMessage += `Assurez-vous d'ajouter cette URI exacte dans votre console Google Cloud.`;
      }
      
      setErrorDetails(errorMessage);
      return true;
    }
    return false;
  };

  // Function to redirect to root
  const redirectToRoot = () => {
    navigate('/dashboard');
  };

  // Function to go back to the previous page 
  const goBack = () => {
    navigate(-1);
  };

  return {
    status,
    errorDetails,
    processStandardAuth,
    processGoogleSheetsAuth,
    checkForErrors,
    redirectToRoot,
    goBack,
  };
};
