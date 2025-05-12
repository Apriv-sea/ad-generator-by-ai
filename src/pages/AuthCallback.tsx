
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AuthCallback = () => {
  const [status, setStatus] = useState<string>("Traitement de l'authentification...");
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extraire les paramètres de l'URL fragment (après le #)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");

        if (!accessToken) {
          setStatus("Erreur: Aucun token d'accès trouvé");
          toast.error("Échec de l'authentification");
          setTimeout(() => navigate("/auth"), 2000);
          return;
        }

        // Récupérer les informations de l'utilisateur avec le token
        const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!userInfoResponse.ok) {
          throw new Error("Échec de la récupération des informations utilisateur");
        }

        const userData = await userInfoResponse.json();

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
        setStatus("Une erreur est survenue lors de l'authentification");
        toast.error("Échec de l'authentification");
        setTimeout(() => navigate("/auth"), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">{status}</h1>
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    </div>
  );
};

export default AuthCallback;
