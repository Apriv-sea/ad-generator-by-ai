
import React from "react";
import AuthDebugDialog from "@/components/AuthDebugDialog";
import { Button } from "@/components/ui/button";

interface AuthCallbackErrorProps {
  errorDetails: string;
}

const AuthCallbackError: React.FC<AuthCallbackErrorProps> = ({ errorDetails }) => {
  // Check if the error is related to localhost connection issues
  const isLocalhostError = errorDetails.toLowerCase().includes('localhost') || 
                          errorDetails.toLowerCase().includes('origin') || 
                          errorDetails.toLowerCase().includes('redirect');

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

      {isLocalhostError && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
          <p className="font-semibold">Problème de connexion localhost détecté :</p>
          <p>Si vous utilisez localhost pour le développement, assurez-vous que :</p>
          <ul className="list-disc pl-5 text-left">
            <li>L'URL exacte <code>{window.location.origin}</code> est ajoutée aux "Origines JavaScript autorisées" dans Google Cloud Console</li>
            <li>Les URL suivantes sont également ajoutées :
              <ul className="list-disc pl-5 mt-1">
                <li><code>http://localhost:5173</code></li>
                <li><code>http://localhost:3000</code></li>
                <li><code>http://localhost:8080</code></li>
              </ul>
            </li>
            <li>Les paramètres des URL sont exactement identiques (incluant http/https et le numéro de port)</li>
          </ul>
          <div className="flex justify-center mt-2">
            <AuthDebugDialog trigger={
              <Button variant="outline" size="sm">
                Afficher les informations de débogage détaillées
              </Button>
            } />
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthCallbackError;
