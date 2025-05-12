
import React from "react";

const DebugOAuthConfig: React.FC = () => {
  return (
    <div>
      <h3 className="font-medium mb-1">Configuration Google OAuth</h3>
      <ol className="list-decimal pl-5 text-sm space-y-1">
        <li>Vérifiez que l'URL de redirection <code>{window.location.origin}/auth/callback</code> est correctement configurée comme URI autorisé dans Google Cloud Console</li>
        <li>Vérifiez que ces URLs sont ajoutées comme "Origines JavaScript autorisées" dans la console Google:
          <ul className="list-disc pl-5 mt-1">
            <li><code>{window.location.origin}</code></li>
            <li><code>http://localhost:5173</code></li>
            <li><code>http://localhost:3000</code></li>
          </ul>
        </li>
        <li>Vérifiez que votre ID client et Secret client sont correctement configurés dans Supabase</li>
      </ol>
    </div>
  );
};

export default DebugOAuthConfig;
