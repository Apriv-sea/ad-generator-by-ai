
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AuthCallback: React.FC = () => {
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const navigate = useNavigate();

  useEffect(() => {
    const processCallback = () => {
      try {
        // Extraire les paramètres d'URL du hash pour OAuth2 implicit grant
        const fragment = window.location.hash.substring(1);
        const params = new URLSearchParams(fragment);
        
        const accessToken = params.get('access_token');
        const tokenType = params.get('token_type');
        const expiresIn = params.get('expires_in');
        const state = params.get('state');
        
        // Vérifier que l'état correspond à celui stocké
        const savedState = localStorage.getItem('google_auth_state');
        
        if (!accessToken || !state || state !== savedState) {
          console.error("Erreur d'authentification: token manquant ou état non valide");
          setStatus("error");
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
        
      } catch (error) {
        console.error("Erreur lors du traitement du callback:", error);
        setStatus("error");
        toast.error("Erreur lors du traitement de l'authentification");
      }
    };
    
    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-card shadow-lg rounded-lg p-8 max-w-md w-full">
        <div className="text-center">
          {status === "processing" && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h2 className="text-2xl font-semibold mb-2">Traitement de l'authentification...</h2>
              <p className="text-muted-foreground">Veuillez patienter pendant que nous finalisons votre connexion Google Sheets.</p>
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
              <p className="text-muted-foreground">Vous êtes maintenant connecté à Google Sheets. Redirection en cours...</p>
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
              <p className="text-muted-foreground mb-4">Une erreur s'est produite lors de la connexion à Google Sheets.</p>
              <button 
                className="px-4 py-2 bg-primary text-primary-foreground rounded"
                onClick={() => navigate(-1)}
              >
                Retourner à l'application
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
