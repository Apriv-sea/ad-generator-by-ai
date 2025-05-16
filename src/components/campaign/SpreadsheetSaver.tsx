
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sheet, sheetService } from "@/services/googleSheetsService";
import XLSXSheetEditor from "../sheet/XLSXSheetEditor";
import { addTableStyles } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";

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
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Ajouter les styles personnalisés pour le tableur
  useEffect(() => {
    addTableStyles();
    return () => {
      // Nettoyer les styles lors du démontage du composant
      const styleElement = document.getElementById('handsontable-custom-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

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
    <div className={showFullscreen ? "fixed inset-0 z-50 bg-background p-4" : ""}>
      <div className={showFullscreen ? "h-full flex flex-col" : ""}>
        {showFullscreen && (
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2 text-primary" />
              <h2 className="text-xl font-semibold">Mode plein écran</h2>
            </div>
            <Button 
              onClick={() => setShowFullscreen(false)}
              variant="outline"
              size="sm"
            >
              Quitter le mode plein écran
            </Button>
          </div>
        )}
        
        {sheetData && (
          <div className={showFullscreen ? "flex-1 overflow-hidden" : ""}>
            <XLSXSheetEditor 
              initialData={sheetData} 
              onSave={handleSpreadsheetSave}
              showFullscreenButton={!showFullscreen}
              onFullscreen={() => setShowFullscreen(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SpreadsheetSaver;
