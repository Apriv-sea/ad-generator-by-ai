
import React, { useState } from "react";
import { toast } from "sonner";
import { Sheet, sheetService } from "@/services/googleSheetsService";
import SpreadsheetEditor from "../sheet/SpreadsheetEditor";

interface SpreadsheetSaverProps {
  sheet: Sheet;
  sheetData: any[][] | null;
  setSheetData: React.Dispatch<React.SetStateAction<any[][] | null>>;
  onUpdateComplete: () => void;
}

const SpreadsheetSaver: React.FC<SpreadsheetSaverProps> = ({
  sheet,
  sheetData,
  setSheetData,
  onUpdateComplete
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSpreadsheetSave = async (data: any[][]) => {
    if (!sheet) {
      toast.error("Aucune feuille sélectionnée");
      return;
    }

    setIsSaving(true);
    try {
      // Enregistrer les données du tableur
      const success = await sheetService.writeSheetData(
        sheet.id,
        "", // Range ignoré dans l'implémentation locale
        data
      );
      
      if (success) {
        toast.success("Tableur sauvegardé avec succès");
        setSheetData(data);
        onUpdateComplete();
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du tableur:", error);
      toast.error("Impossible de sauvegarder le tableur");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {sheetData && (
        <SpreadsheetEditor 
          data={sheetData} 
          sheetId={sheet.id}
          onSave={handleSpreadsheetSave}
        />
      )}
    </>
  );
};

export default SpreadsheetSaver;
