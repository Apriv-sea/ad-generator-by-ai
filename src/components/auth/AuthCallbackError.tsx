
import React from "react";
import AuthDebugDialog from "@/components/AuthDebugDialog";
import { Button } from "@/components/ui/button";

interface AuthCallbackErrorProps {
  errorDetails: string;
}

const AuthCallbackError: React.FC<AuthCallbackErrorProps> = ({ errorDetails }) => {
  // Check if the error is related to connection issues
  const isRedirectError = errorDetails.toLowerCase().includes('origin') || 
                         errorDetails.toLowerCase().includes('redirect') ||
                         errorDetails.toLowerCase().includes('uri');
  
  // Check if we're running on localhost
  const isLocalhost = window.location.hostname === "localhost" || 
                     window.location.hostname === "127.0.0.1";

  return (
    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
      <h2 className="font-semibold">Détails de l'erreur :</h2>
      <p className="mt-1">{errorDetails}</p>
      
      <div className="mt-3 text-xs">
        <p>Vérifiez que :</p>
        <ul className="list-disc pl-5 text-left">
          <li>Votre compte est ajouté comme utilisateur de test dans Google Cloud Console</li>
          <li>L'URL de redirection <code className="font-bold">{window.location.origin}/auth/callback</code> est exactement configurée comme URI autorisé dans Google Cloud Console</li>
          <li>L'URL racine <code className="font-bold">{window.location.origin}</code> est également configurée comme URI autorisé</li>
          <li>L'écran de consentement OAuth est correctement configuré</li>
        </ul>
      </div>

      {isLocalhost && (
        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded">
          <p className="font-semibold">Problème de localhost détecté:</p>
          <p>Lorsque vous utilisez localhost, assurez-vous de:</p>
          <ol className="list-decimal pl-5 text-left">
            <li>Ajouter <code className="font-bold">http://localhost:{window.location.port || "3000"}</code> aux "Origines JavaScript autorisées" dans Google Cloud Console</li>
            <li>Ajouter <code className="font-bold">http://localhost:{window.location.port || "3000"}/auth/callback</code> aux "URI de redirection autorisés"</li>
            <li>Utiliser <strong>exactement</strong> le même port dans les URL configurées dans Google Cloud Console</li>
            <li>Essayer d'utiliser un navigateur différent ou mode incognito</li>
            <li>Vérifier si des extensions de navigateur bloquent les cookies tiers</li>
          </ol>
        </div>
      )}

      {isRedirectError && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
          <p className="font-semibold">Problème de redirection détecté :</p>
          <p>Assurez-vous que :</p>
          <ul className="list-disc pl-5 text-left">
            <li>L'URL exacte <code className="font-bold">{window.location.origin}</code> est ajoutée aux "Origines JavaScript autorisées" dans Google Cloud Console</li>
            <li>L'URL <code className="font-bold">{window.location.origin}/auth/callback</code> est ajoutée aux "URI de redirection autorisés"</li>
            <li>Si vous avez activé l'option "Autoriser toutes les origines", vérifiez que cela est bien configuré</li>
            <li>Les paramètres des URL sont exactement identiques (incluant http/https)</li>
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
