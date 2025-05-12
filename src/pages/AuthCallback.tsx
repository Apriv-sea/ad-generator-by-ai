
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const [status, setStatus] = useState<string>("Traitement de l'authentification...");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Vérifier si l'URL contient une erreur
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get("error");
        
        if (error) {
          console.error("Erreur OAuth:", error);
          setStatus(`Erreur d'authentification: ${error}`);
          setErrorDetails(urlParams.get("error_description") || "Aucune description disponible");
          toast.error(`Échec de l'authentification: ${error}`);
          setTimeout(() => navigate("/auth"), 5000);
          return;
        }
        
        // Vérifier si nous avons déjà une session Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Session Supabase déjà active, redirection...");
          toast.success("Connexion réussie!");
          setTimeout(() => navigate("/dashboard"), 1000);
          return;
        }

        // Si c'est une redirection de Google avec un token dans le fragment d'URL
        if (window.location.hash && window.location.hash.includes('access_token')) {
          console.log("Fragment d'URL détecté avec access_token");
          
          // Tentative de traiter le hash comme une réponse d'authentification Supabase
          try {
            // Les paramètres sont après le #, donc on les extrait
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            
            if (hashParams.get('access_token')) {
              // Définir la session dans Supabase à partir du hash
              const { error } = await supabase.auth.setSession({
                access_token: hashParams.get('access_token') || '',
                refresh_token: hashParams.get('refresh_token') || '',
              });

              if (error) {
                throw error;
              }

              // Vérifier que la session est bien définie
              const { data: sessionData } = await supabase.auth.getSession();
              
              if (sessionData.session) {
                console.log("Session définie avec succès depuis le fragment d'URL");
                toast.success("Connexion réussie!");
                setStatus("Authentification réussie! Redirection...");
                setTimeout(() => navigate("/dashboard"), 1000);
                return;
              }
            }
          } catch (hashError) {
            console.error("Erreur lors du traitement du hash:", hashError);
            setErrorDetails(hashError instanceof Error ? hashError.message : "Erreur lors du traitement de la réponse");
          }
        }
        
        // Si nous arrivons ici, c'est que nous n'avons pas pu extraire ou définir de session
        setStatus("Impossible de récupérer les informations de session");
        setErrorDetails("Veuillez réessayer de vous connecter");
        toast.error("Échec de l'authentification");
        setTimeout(() => navigate("/auth"), 5000);
      } catch (error) {
        console.error("Erreur d'authentification:", error);
        setStatus(`Une erreur est survenue lors de l'authentification`);
        setErrorDetails(error instanceof Error ? error.message : "Erreur inconnue");
        setDebugInfo(`URL configurée: ${window.location.origin}/auth/callback`);
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
            {debugInfo && (
              <div className="mt-3 text-xs p-2 bg-gray-100 rounded overflow-auto max-w-full">
                <code>{debugInfo}</code>
              </div>
            )}
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
