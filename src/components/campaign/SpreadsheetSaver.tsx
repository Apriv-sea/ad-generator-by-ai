
import React from "react";
import { Sheet, VALIDATED_COLUMNS } from "@/services/sheetService";
import CryptPadEmbed from "../sheet/CryptPadEmbed";
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
    localStorage.setItem(`cryptpad_url_${sheet.id}`, url);
    
    // Notifier que la mise à jour est terminée
    onUpdateComplete();
  };

  // Récupérer l'URL de CryptPad depuis le localStorage s'il existe
  const savedUrl = localStorage.getItem(`cryptpad_url_${sheet.id}`) || "";

  return (
    <div className="w-full space-y-4">
      <Alert variant="default" className="bg-blue-50 border-blue-200">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Feuille CryptPad avec colonnes validées</AlertTitle>
        <AlertDescription>
          Cette feuille CryptPad est configurée avec {VALIDATED_COLUMNS.length} colonnes validées 
          pour vos campagnes publicitaires, y compris les titres et descriptions.
        </AlertDescription>
      </Alert>
      
      <CryptPadEmbed
        sheetUrl={savedUrl}
        onSheetUrlChange={handleSheetUrlChange}
        sheet={sheet}
      />
    </div>
  );
};

export default SpreadsheetSaver;
