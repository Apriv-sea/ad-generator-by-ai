
import React from "react";
import { Sheet, VALIDATED_COLUMNS } from "@/services/googleSheetsService";
import GoogleSheetsEmbed from "../sheet/GoogleSheetsEmbed";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

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
    <div className="w-full space-y-4">
      <Alert variant="default" className="bg-blue-50 border-blue-200">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Tableur Google Sheets avec colonnes validées</AlertTitle>
        <AlertDescription>
          Cette feuille Google Sheets est configurée avec {VALIDATED_COLUMNS.length} colonnes validées 
          pour vos campagnes publicitaires, y compris les titres et descriptions.
        </AlertDescription>
      </Alert>
      
      <GoogleSheetsEmbed
        sheetUrl={savedUrl}
        onSheetUrlChange={handleSheetUrlChange}
        sheet={sheet}
      />
    </div>
  );
};

export default SpreadsheetSaver;
