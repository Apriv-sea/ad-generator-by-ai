
import React from "react";

const DebugOAuthConfig: React.FC = () => {
  return (
    <div>
      <h3 className="font-medium mb-1">Configuration Google OAuth</h3>
      <ol className="list-decimal pl-5 text-sm space-y-1">
        <li>Vérifiez que l'URL de redirection <code>{window.location.origin}/auth/callback</code> est correctement configurée comme URI autorisé dans Google Cloud Console</li>
        <li>Vérifiez que ces URLs sont ajoutées comme "Origines JavaScript autorisées" dans la console Google:
          <ul className="list-disc pl-5 mt-1">
            <li><code>{window.location.origin}</code> (votre URL actuelle)</li>
            <li><code>http://localhost:5173</code> (Vite dev server)</li>
            <li><code>http://localhost:3000</code> (React dev server)</li>
            <li><code>http://localhost:8080</code> (Port alternatif)</li>
          </ul>
        </li>
        <li>Vérifiez que votre ID client et Secret client sont correctement configurés dans Supabase</li>
        <li>Assurez-vous que le protocole (http/https) et le port correspondent exactement dans les URLs autorisées</li>
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
