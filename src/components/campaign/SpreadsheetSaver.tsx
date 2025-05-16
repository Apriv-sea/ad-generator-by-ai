
import React from "react";
import { Sheet } from "@/services/googleSheetsService";
import GoogleSheetsEmbed from "../sheet/GoogleSheetsEmbed";

interface SpreadsheetSaverProps {
  sheet: Sheet;
  sheetData: any[][] | null;
  setSheetData: React.Dispatch<React.SetStateAction<any[][] | null>>;
  onUpdateComplete: () => void;
}

const SpreadsheetSaver: React.FC<SpreadsheetSaverProps> = ({
  sheet,
  onUpdateComplete
}) => {
  const handleSheetUrlChange = (url: string) => {
    // Sauvegarder l'URL dans localStorage pour la persistance
    localStorage.setItem(`google_sheet_url_${sheet.id}`, url);
    
    // Notifier que la mise à jour est terminée
    onUpdateComplete();
  };

  // Récupérer l'URL de Google Sheet depuis le localStorage s'il existe
  const savedUrl = localStorage.getItem(`google_sheet_url_${sheet.id}`) || "";

  return (
    <div className="w-full">
      <GoogleSheetsEmbed
        sheetUrl={savedUrl}
        onSheetUrlChange={handleSheetUrlChange}
        sheet={sheet}
      />
    </div>
  );
};

export default SpreadsheetSaver;
