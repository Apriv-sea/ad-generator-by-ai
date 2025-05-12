
import React from "react";

const DebugOAuthConfig: React.FC = () => {
  return (
    <div>
      <h3 className="font-medium mb-1">Configuration Google OAuth</h3>
      <ol className="list-decimal pl-5 text-sm space-y-1">
        <li>Vérifiez que l'URL de redirection <code>{window.location.origin}/auth/callback</code> est correctement configurée comme URI de redirection autorisé dans Google Cloud Console</li>
        <li>Vérifiez que votre URL actuelle est ajoutée comme "Origine JavaScript autorisée" dans la console Google:
          <ul className="list-disc pl-5 mt-1">
            <li><code>{window.location.origin}</code> (votre URL actuelle)</li>
          </ul>
        </li>
        <li>Assurez-vous que votre ID client et Secret client sont correctement configurés dans Supabase</li>
        <li>Vérifiez que le protocole (http/https) correspond exactement dans les URLs autorisées</li>
        <li>Si vous utilisez un navigateur avec blocage de cookies/scripts tiers, essayez avec un autre navigateur</li>
      </ol>
      <div className="mt-2 p-2 bg-slate-100 rounded">
        <p className="text-xs">URL actuelle: <code>{window.location.href}</code></p>
        <p className="text-xs">Origine actuelle: <code>{window.location.origin}</code></p>
      </div>
    </div>
  );
};

export default DebugOAuthConfig;
