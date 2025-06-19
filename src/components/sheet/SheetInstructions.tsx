
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const SheetInstructions: React.FC = () => {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        <strong>Prérequis :</strong>
        <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
          <li>Configurez votre clé API Google dans les paramètres</li>
          <li>Ouvrez votre Google Sheets</li>
          <li>Cliquez sur "Partager" en haut à droite</li>
          <li>Changez l'accès en "Visible par toute personne ayant le lien"</li>
          <li>Copiez l'URL ou l'ID de la feuille ci-dessous</li>
        </ol>
      </AlertDescription>
    </Alert>
  );
};

export default SheetInstructions;
