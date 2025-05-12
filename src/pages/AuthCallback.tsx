
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const [status, setStatus] = useState<string>("Traitement de l'authentification...");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const navigate = useNavigate();

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

        // Check for access_token in URL hash or as a standalone JWT
        let accessToken = null;
        let refreshToken = null;
        
        // First check if we have a hash fragment with tokens
        if (window.location.hash) {
          console.log("Hash fragment detected, processing tokens...");
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
        } 
        // If no access token in hash, check if the URL itself is a JWT token
        else if (window.location.pathname.length > 20 && window.location.pathname.includes('.')) {
          console.log("URL appears to be a JWT token, extracting...");
          accessToken = window.location.pathname.substring(1); // Remove leading slash
        }
        
        if (accessToken) {
          console.log("Access token found, attempting to set session...");
          
          try {
            // Set the session with Supabase using the token
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
                  accessToken: accessToken,
                  email: data.session.user.email,
                  name: data.session.user?.user_metadata?.full_name || data.session.user.email,
                  picture: data.session.user?.user_metadata?.picture || data.session.user?.user_metadata?.avatar_url
                };
                
                localStorage.setItem("google_user", JSON.stringify(userData));
              }
              
              toast.success("Connexion réussie!");
              setStatus("Authentification réussie! Redirection...");
              setTimeout(() => navigate("/dashboard"), 1000);
              return;
            }
          } catch (tokenError) {
            console.error("Error processing token:", tokenError);
            setErrorDetails(String(tokenError));
          }
        }
        
        // Check for existing session as fallback
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Existing session found");
          
          if (session.user?.app_metadata?.provider === 'google') {
            localStorage.setItem("google_connected", "true");
            
            // Store basic user data even if we didn't get it from the token
            const userData = {
              provider: 'google',
              email: session.user.email,
              name: session.user?.user_metadata?.full_name || session.user.email,
              picture: session.user?.user_metadata?.picture || session.user?.user_metadata?.avatar_url
            };
            
            localStorage.setItem("google_user", JSON.stringify(userData));
          }
          
          toast.success("Connexion réussie!");
          setTimeout(() => navigate("/dashboard"), 1000);
          return;
        }
        
        // If we get here, authentication failed
        setStatus("Échec de l'authentification");
        setErrorDetails("Impossible de récupérer les informations de session");
        toast.error("Échec de l'authentification");
        setTimeout(() => navigate("/auth"), 5000);
      } catch (error) {
        console.error("Authentication error:", error);
        setStatus("Une erreur est survenue");
        setErrorDetails(error instanceof Error ? error.message : "Erreur inconnue");
        toast.error("Échec de l'authentification");
        setTimeout(() => navigate("/auth"), 5000);
      }
    };

    handleCallback();
  }, [navigate]);

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
                <li>L'écran de consentement OAuth est correctement configuré</li>
                <li>Le domaine <code>{window.location.origin}</code> est ajouté comme domaine autorisé</li>
              </ul>
            </div>
          </div>
        )}
        <div className="mt-4 animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    </div>
  );
};

export default AuthCallback;
