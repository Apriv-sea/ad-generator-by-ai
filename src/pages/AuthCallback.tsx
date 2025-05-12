
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AuthDebugDialog from "@/components/AuthDebugDialog";
import { Button } from "@/components/ui/button";

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
        const error = urlParams.get("error");
        
        if (error) {
          console.error("OAuth error:", error);
          setStatus(`Erreur d'authentification: ${error}`);
          setErrorDetails(urlParams.get("error_description") || "Aucune description disponible");
          toast.error(`Échec de l'authentification: ${error}`);
          setTimeout(() => navigate("/auth"), 5000);
          return;
        }

        // Vérifier si la session existe déjà (cas où le token a été traité par AuthContext)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Session already exists, redirecting to dashboard");
          toast.success("Connexion réussie!");
          setTimeout(() => navigate("/dashboard"), 1000);
          return;
        }
        
        // Check for access_token in URL hash or as a standalone JWT
        let accessToken = null;
        let refreshToken = null;
        
        // First check if we have a hash fragment with tokens
        if (window.location.hash) {
          console.log("Hash fragment detected, processing tokens...");
          setIsTokenFound(true);
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
        } 
        // If no access token in hash, check if the URL itself is a JWT token
        else if (window.location.pathname.length > 20 && window.location.pathname.includes('.')) {
          console.log("URL appears to be a JWT token, extracting...");
          setIsTokenFound(true);
          accessToken = window.location.pathname.substring(1); // Remove leading slash
        }
        
        if (accessToken) {
          console.log("Access token found, attempting to set session...");
          
          try {
            // Try to process token using the centralized function first
            const tokenProcessed = await processAuthTokens();
            
            if (tokenProcessed) {
              console.log("Token processed successfully through AuthContext");
              toast.success("Connexion réussie!");
              setStatus("Authentification réussie! Redirection...");
              
              // Nettoyer l'URL
              window.history.replaceState({}, document.title, window.location.pathname);
              
              setTimeout(() => navigate("/dashboard"), 1000);
              return;
            }
            
            // Fallback to manual token processing if the above fails
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            
            if (error) {
              console.error("Error setting session:", error);
              throw error;
            }
            
            if (data.session) {
              console.log("Session successfully established");
              
              // Store user preferences
              if (data.session.user?.app_metadata?.provider === 'google') {
                localStorage.setItem("google_connected", "true");
                
                // Store Google user info
                const userData = {
                  provider: 'google',
                  email: data.session.user.email,
                  name: data.session.user?.user_metadata?.full_name || data.session.user.email,
                  picture: data.session.user?.user_metadata?.picture || data.session.user?.user_metadata?.avatar_url
                };
                
                localStorage.setItem("google_user", JSON.stringify(userData));
              }
              
              toast.success("Connexion réussie!");
              setStatus("Authentification réussie! Redirection...");
              
              // Nettoyer l'URL
              window.history.replaceState({}, document.title, window.location.pathname);
              
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
        
        // Si nous arrivons ici, l'authentification a échoué
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
  }, [navigate, processAuthTokens]);

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
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-lg p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">{status}</h1>
        {errorDetails && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            <h2 className="font-semibold">Détails de l'erreur :</h2>
            <p className="mt-1">{errorDetails}</p>
            <div className="mt-3 text-xs">
              <p>Vérifiez que :</p>
              <ul className="list-disc pl-5 text-left">
                <li>Votre compte est ajouté comme utilisateur de test dans Google Cloud Console</li>
                <li>L'URL de redirection <code>{window.location.origin}/auth/callback</code> est exactement configurée comme URI autorisé dans Google Cloud Console</li>
                <li>L'URL racine <code>{window.location.origin}</code> est également configurée comme URI autorisé</li>
                <li>L'écran de consentement OAuth est correctement configuré</li>
                <li>Le domaine <code>{window.location.origin}</code> est ajouté comme domaine autorisé</li>
              </ul>
            </div>
          </div>
        )}
        
        <div className="mt-4 animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        
        <div className="mt-6 space-y-2">
          <Button variant="outline" onClick={() => navigate("/auth")} className="mx-1">
            Retour à la page de connexion
          </Button>
          
          {isTokenFound && (
            <Button onClick={manualRedirectToRoot} className="mx-1">
              Rediriger vers la page d'accueil avec le jeton
            </Button>
          )}
          
          <div className="mt-4">
            <AuthDebugDialog trigger={
              <Button variant="link" size="sm">
                Afficher les informations de débogage
              </Button>
            } />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
