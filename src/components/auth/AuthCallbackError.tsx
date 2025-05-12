
import React from "react";

interface AuthCallbackErrorProps {
  errorDetails: string;
}

const AuthCallbackError: React.FC<AuthCallbackErrorProps> = ({ errorDetails }) => {
  return (
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
  );
};

export default AuthCallbackError;
