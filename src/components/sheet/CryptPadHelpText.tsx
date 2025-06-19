
import React from "react";

const CryptPadHelpText: React.FC = () => {
  return (
    <div className="text-xs text-muted-foreground space-y-1">
      <p>• L'URL ressemble à : https://cryptpad.fr/sheet/#/2/sheet/edit/ABC123.../</p>
      <p>• L'ID est la partie après /edit/</p>
      <p>• Exemple d'ID: AbC123XyZ456</p>
    </div>
  );
};

export default CryptPadHelpText;
