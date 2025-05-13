
import React from "react";

const DebugTroubleshooting: React.FC = () => {
  return (
    <div>
      <h3 className="font-medium mb-1">Étapes de dépannage</h3>
      <ol className="list-decimal pl-5 text-sm space-y-1">
        <li>Vérifiez que votre email est ajouté comme utilisateur de test dans la configuration d'authentification</li>
        <li>Essayez de supprimer les cookies du navigateur et les données de localStorage</li>
        <li>Essayez un autre navigateur</li>
        <li>Assurez-vous que le domaine <code>{window.location.origin}</code> est ajouté comme domaine autorisé</li>
      </ol>
    </div>
  );
};

export default DebugTroubleshooting;
