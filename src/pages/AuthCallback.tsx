
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AuthCallback = () => {
  const [status, setStatus] = useState<string>("Traitement de l'authentification...");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Vérifier si l'URL contient une erreur
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get("error");
        
        if (error) {
          const errorDescription = urlParams.get("error_description") || "Aucune description disponible";
          console.error("Erreur OAuth:", error, "Description:", errorDescription);
          setStatus(`Erreur d'authentification: ${error}`);
          setErrorDetails(errorDescription);
          toast.error(`Échec de l'authentification: ${error}`);
          setTimeout(() => navigate("/auth"), 5000);
          return;
        }
        
        // Extraire les paramètres de l'URL fragment (après le #)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");

        if (!accessToken) {
          console.error("Aucun token trouvé dans l'URL. Hash params:", window.location.hash);
          setStatus("Erreur: Aucun token d'accès trouvé");
          setErrorDetails("Vérifiez la configuration OAuth dans Google Cloud Console");
          toast.error("Échec de l'authentification");
          setTimeout(() => navigate("/auth"), 5000);
          return;
        }

        console.log("Token d'accès récupéré, longueur:", accessToken.length);
        
        // Récupérer les informations de l'utilisateur avec le token
        const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!userInfoResponse.ok) {
          const errorData = await userInfoResponse.text();
          console.error("Erreur API userInfo:", userInfoResponse.status, errorData);
          throw new Error(`Échec de la récupération des informations utilisateur: ${errorData}`);
        }

        const userData = await userInfoResponse.json();
        console.log("Informations utilisateur récupérées:", userData);

        // Créer l'objet utilisateur
        const user = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          picture: userData.picture,
          accessToken: accessToken
        };

        // Sauvegarder l'utilisateur et les autorisations
        localStorage.setItem("google_user", JSON.stringify(user));
        localStorage.setItem("google_connected", "true");
        localStorage.setItem("google_sheets_access", "true");
        localStorage.setItem("google_drive_access", "true");

        toast.success("Connexion réussie!");
        setStatus("Authentification réussie! Redirection...");
        
        // Rediriger vers le tableau de bord
        setTimeout(() => navigate("/dashboard"), 1000);
      } catch (error) {
        console.error("Erreur d'authentification:", error);
        setStatus(`Une erreur est survenue lors de l'authentification`);
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
                <li>L'écran de consentement OAuth est correctement configuré</li>
                <li>Le domaine est ajouté comme domaine autorisé</li>
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
