
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

interface GoogleSheetsEmbedProps {
  sheetUrl?: string;
  onSheetUrlChange: (url: string) => void;
}

const GoogleSheetsEmbed: React.FC<GoogleSheetsEmbedProps> = ({
  sheetUrl,
  onSheetUrlChange
}) => {
  const [inputUrl, setInputUrl] = useState(sheetUrl || '');
  const [validUrl, setValidUrl] = useState(!!sheetUrl);

  // Fonction pour extraire l'ID de la feuille à partir de l'URL
  const extractSheetId = (url: string): string | null => {
    try {
      // Format typique: https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0
      const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      return match ? match[1] : null;
    } catch (error) {
      console.error("Erreur lors de l'extraction de l'ID de la feuille:", error);
      return null;
    }
  };

  // Fonction pour générer l'URL d'intégration
  const generateEmbedUrl = (sheetId: string): string => {
    return `https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing&embedded=true`;
  };

  // Fonction pour gérer la soumission de l'URL
  const handleSubmit = () => {
    const sheetId = extractSheetId(inputUrl);
    
    if (!sheetId) {
      toast.error("URL Google Sheets invalide. Veuillez vérifier le format.");
      return;
    }
    
    const embedUrl = generateEmbedUrl(sheetId);
    onSheetUrlChange(embedUrl);
    setValidUrl(true);
    toast.success("Feuille Google Sheets intégrée avec succès");
  };

  // Fonction pour ouvrir la feuille dans un nouvel onglet
  const openInNewTab = () => {
    if (sheetUrl) {
      window.open(sheetUrl, '_blank');
    }
  };

  return (
    <Card className="overflow-hidden border-none shadow-lg">
      <div className="bg-primary/5 p-3 flex justify-between items-center">
        <div className="flex items-center">
          <FileSpreadsheet className="h-5 w-5 mr-2 text-primary" />
          <h3 className="font-medium">Google Sheets</h3>
        </div>
        <div className="flex gap-2">
          {validUrl && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={openInNewTab}
              className="gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              Ouvrir dans Google Sheets
            </Button>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Coller l'URL d'une feuille Google Sheets"
              className="flex-1"
            />
            <Button onClick={handleSubmit}>
              <Save className="h-4 w-4 mr-2" />
              Intégrer
            </Button>
          </div>
          
          {validUrl && sheetUrl && (
            <div className="border rounded-md overflow-hidden" style={{ height: '700px' }}>
              <iframe
                src={sheetUrl}
                title="Google Sheets Embed"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
              />
            </div>
          )}
          
          {!validUrl && (
            <div className="p-8 text-center text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-25" />
              <p>Collez l'URL d'une feuille Google Sheets pour l'intégrer ici.</p>
              <p className="text-sm mt-2">
                Format: https://docs.google.com/spreadsheets/d/VOTRE_ID_DE_FEUILLE/edit
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsEmbed;
