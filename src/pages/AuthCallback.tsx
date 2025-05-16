
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import DebugOAuthConfig from "@/components/debug/DebugOAuthConfig";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { processAuthTokens } from "@/utils/authUtils";
import { Card, CardContent } from "@/components/ui/card";

const AuthCallback: React.FC = () => {
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Vérifier si c'est un callback Google Sheets
        const isGoogleSheetsCallback = location.pathname.includes('/google');
        
        if (isGoogleSheetsCallback) {
          processGoogleSheetsCallback();
        } else {
          // Traitement standard pour le callback d'authentification de l'application
          const success = await processAuthTokens();
          if (success) {
            setStatus("success");
            setTimeout(() => navigate('/dashboard'), 1500);
          } else {
            setStatus("error");
            setErrorDetails("Aucun jeton d'authentification trouvé dans l'URL.");
          }
        }
      } catch (error: any) {
        console.error("Erreur lors du traitement du callback:", error);
        setStatus("error");
        setErrorDetails(error.message || "Une erreur inconnue s'est produite");
        toast.error("Erreur lors du traitement de l'authentification");
      }
    };
    
    // Vérifier s'il y a des erreurs dans l'URL (comme redirect_uri_mismatch)
    const checkForErrors = () => {
      const searchParams = new URLSearchParams(location.search);
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      if (error) {
        setStatus("error");
        let errorMessage = `Erreur: ${error}`;
        if (errorDescription) {
          errorMessage += `\nDescription: ${errorDescription}`;
        }
        
        // Gérer spécifiquement l'erreur de mismatch d'URI
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
    
    const processGoogleSheetsCallback = () => {
      try {
        // Vérifier s'il y a des erreurs
        if (checkForErrors()) return;
        
        // Extraire les paramètres d'URL du hash pour OAuth2 implicit grant
        const fragment = window.location.hash.substring(1);
        const params = new URLSearchParams(fragment);
        
        const accessToken = params.get('access_token');
        const expiresIn = params.get('expires_in');
        const state = params.get('state');
        
        // Vérifier que l'état correspond à celui stocké
        const savedState = localStorage.getItem('google_auth_state');
        
        if (!accessToken || !state || state !== savedState) {
          console.error("Erreur d'authentification: token manquant ou état non valide");
          setStatus("error");
          setErrorDetails("Token manquant ou état de sécurité non valide. Veuillez réessayer l'authentification.");
          toast.error("Échec de l'authentification Google");
          return;
        }
        
        // Stocker le token d'accès
        localStorage.setItem('google_access_token', accessToken);
        localStorage.removeItem('google_auth_state'); // Nettoyer l'état
        
        // Calculer la date d'expiration
        if (expiresIn) {
          const expiryTime = new Date().getTime() + parseInt(expiresIn) * 1000;
          localStorage.setItem('google_token_expiry', expiryTime.toString());
        }
        
        setStatus("success");
        toast.success("Authentification Google réussie");
        
        // Rediriger vers la page précédente après un court délai
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      } catch (error: any) {
        console.error("Erreur lors du traitement du callback Google:", error);
        setStatus("error");
        setErrorDetails(error.message || "Une erreur s'est produite lors de l'authentification Google Sheets");
      }
    };
    
    // Vérifier d'abord les erreurs d'URL
    const hasErrors = checkForErrors();
    if (!hasErrors) {
      processCallback();
    }
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="shadow-lg rounded-lg max-w-lg w-full">
        <CardContent className="p-6">
          <div className="text-center">
            {status === "processing" && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <h2 className="text-2xl font-semibold mb-2">Traitement de l'authentification...</h2>
                <p className="text-muted-foreground">Veuillez patienter pendant que nous finalisons votre connexion.</p>
              </>
            )}
            
            {status === "success" && (
              <>
                <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-2 text-green-600">Authentification réussie!</h2>
                <p className="text-muted-foreground">Vous êtes maintenant connecté. Redirection en cours...</p>
              </>
            )}
            
            {status === "error" && (
              <>
                <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-2 text-red-600">Échec de l'authentification</h2>
                
                {errorDetails && (
                  <Alert variant="destructive" className="mt-4 mb-4 text-left">
                    <AlertTitle>Détails de l'erreur:</AlertTitle>
                    <AlertDescription>
                      <pre className="whitespace-pre-wrap text-sm mt-1">{errorDetails}</pre>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="mt-6">
                  <Button 
                    className="mb-4"
                    onClick={() => navigate(-1)}
                  >
                    Retourner à l'application
                  </Button>
                </div>
                
                {/* Informations de configuration pour l'authentification Google */}
                <div className="mt-6 border-t pt-4 text-left">
                  <h3 className="font-semibold mb-2">Configuration Google OAuth</h3>
                  
                  <Alert className="mb-4 bg-amber-50">
                    <AlertTitle>Assurez-vous d'ajouter les URI suivantes dans votre console Google Cloud:</AlertTitle>
                    <AlertDescription>
                      <p className="mt-2"><strong>URI JavaScript autorisée:</strong></p>
                      <code className="bg-white p-1 block rounded border mt-1 mb-3">{window.location.origin}</code>
                      
                      <p><strong>URI de redirection autorisée:</strong></p>
                      <code className="bg-white p-1 block rounded border mt-1">{window.location.origin}/auth/callback/google</code>
                    </AlertDescription>
                  </Alert>
                  
                  <DebugOAuthConfig />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
