
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sheet, sheetService } from "@/services/googleSheetsService";
import XLSXSheetEditor from "../sheet/XLSXSheetEditor";
import GoogleSheetsEmbed from "../sheet/GoogleSheetsEmbed";
import { addTableStyles } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileSpreadsheet, Table2 } from "lucide-react";

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
  const [editorMode, setEditorMode] = useState<"local" | "google">("local");
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>(() => {
    // Récupérer l'URL de Google Sheet depuis le localStorage s'il existe
    const savedUrl = localStorage.getItem(`google_sheet_url_${sheet.id}`);
    return savedUrl || "";
  });

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

  // Fonction pour gérer la sauvegarde du tableur local
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

  // Fonction pour gérer le changement d'URL Google Sheets
  const handleSheetUrlChange = (url: string) => {
    setGoogleSheetUrl(url);
    // Sauvegarder l'URL dans localStorage pour la persistance
    localStorage.setItem(`google_sheet_url_${sheet.id}`, url);
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
        
        <Tabs value={editorMode} onValueChange={(value: string) => setEditorMode(value as "local" | "google")}>
          <TabsList className="mb-4">
            <TabsTrigger value="local" className="gap-2">
              <Table2 className="h-4 w-4" />
              Tableur local
            </TabsTrigger>
            <TabsTrigger value="google" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Google Sheets
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="local">
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
          </TabsContent>
          
          <TabsContent value="google">
            <GoogleSheetsEmbed
              sheetUrl={googleSheetUrl}
              onSheetUrlChange={handleSheetUrlChange}
              sheet={sheet}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SpreadsheetSaver;
