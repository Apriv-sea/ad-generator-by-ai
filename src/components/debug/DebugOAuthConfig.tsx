
import React from "react";

const DebugOAuthConfig: React.FC = () => {
  return (
    <div>
      <h3 className="font-medium mb-1">Configuration d'authentification</h3>
      <ol className="list-decimal pl-5 text-sm space-y-1">
        <li>Vérifiez que l'URL de redirection <code className="font-bold">{window.location.origin}/auth/callback</code> est correctement configurée comme URI de redirection autorisé dans le service d'authentification</li>
        <li>Vérifiez que votre URL actuelle est ajoutée comme "Origine JavaScript autorisée" :
          <ul className="list-disc pl-5 mt-1">
            <li><code className="font-bold">{window.location.origin}</code> (votre URL actuelle)</li>
          </ul>
        </li>
        <li>Assurez-vous que votre ID client et Secret client sont correctement configurés</li>
        <li>Vérifiez que le protocole (http/https) correspond exactement dans les URLs autorisées</li>
        <li className="font-semibold">Pendant le développement: ajoutez votre adresse email comme utilisateur de test</li>
      </ol>
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
        <p className="font-semibold">Informations essentielles:</p>
        <p className="text-xs mt-1">URL complète actuelle: <code className="bg-slate-100 p-1 rounded">{window.location.href}</code></p>
        <p className="text-xs">Origine actuelle: <code className="bg-slate-100 p-1 rounded">{window.location.origin}</code></p>
        <p className="text-xs">URI de callback attendu: <code className="bg-slate-100 p-1 rounded">{window.location.origin}/auth/callback</code></p>
        <p className="text-xs mt-2">Host: <code className="bg-slate-100 p-1 rounded">{window.location.host}</code></p>
        <p className="text-xs">Protocol: <code className="bg-slate-100 p-1 rounded">{window.location.protocol}</code></p>
      </div>
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="font-semibold">Important pour les applications non vérifiées:</p>
        <p className="text-xs mt-1">
          Pendant le développement, le service d'authentification peut afficher un écran d'avertissement car l'application n'est pas vérifiée. 
          Suivez les instructions à l'écran pour continuer.
        </p>
      </div>
    </div>
  );
};

export default DebugOAuthConfig;
