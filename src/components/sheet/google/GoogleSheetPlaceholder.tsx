
import React from 'react';
import { FileSpreadsheet } from "lucide-react";

const GoogleSheetPlaceholder: React.FC = () => {
  return (
    <div className="p-8 text-center text-muted-foreground">
      <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-25" />
      <p>Collez l'URL d'une feuille Google Sheets pour l'intégrer ici ou créez-en une nouvelle.</p>
      <p className="text-sm mt-2">
        Format: https://docs.google.com/spreadsheets/d/VOTRE_ID_DE_FEUILLE/edit
      </p>
    </div>
  );
};

export default GoogleSheetPlaceholder;
