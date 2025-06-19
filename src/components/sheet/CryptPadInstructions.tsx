
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const CryptPadInstructions: React.FC = () => {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        <strong>Utilisation avec CryptPad :</strong>
        <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
          <li>Créez une nouvelle feuille de calcul sur CryptPad.fr</li>
          <li>Ajoutez vos données de campagnes publicitaires</li>
          <li>Copiez l'URL de votre feuille ci-dessous</li>
          <li>L'application se connectera à votre feuille en lecture seule</li>
        </ol>
      </AlertDescription>
    </Alert>
  );
};

export default CryptPadInstructions;
