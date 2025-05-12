
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

        // Handle hash fragment from OAuth providers (like Google)
        if (window.location.hash) {
          console.log("Hash fragment detected, processing tokens...");
          
          try {
            // Extract tokens from the hash
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            const expiresIn = hashParams.get('expires_in');
            
            if (accessToken) {
              console.log("Access token found in URL hash");
              
              // Set the session with Supabase using the tokens from the hash
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || ''
              });
              
              if (error) {
                throw error;
              }
              
              if (data.session) {
                console.log("Session successfully set from hash parameters");
                toast.success("Connexion réussie!");
                
                // Store user preferences if needed
                if (data.session.user?.app_metadata?.provider === 'google') {
                  localStorage.setItem("google_connected", "true");
                }
                
                // Redirect to dashboard after successful authentication
                setStatus("Authentification réussie! Redirection...");
                setTimeout(() => navigate("/dashboard"), 1000);
                return;
              }
            }
          } catch (hashError) {
            console.error("Error processing hash tokens:", hashError);
            setErrorDetails(String(hashError));
          }
        }
        
        // Check for existing session as fallback
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Existing session found");
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
