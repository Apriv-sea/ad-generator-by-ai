
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileSpreadsheet, ExternalLink, Info } from "lucide-react";
import { toast } from "sonner";
import { publicSheetsService } from "@/services/google/publicSheetsService";

interface SheetIdInputProps {
  onSheetLoaded: (sheetId: string, data: any) => void;
}

const SheetIdInput: React.FC<SheetIdInputProps> = ({ onSheetLoaded }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast.error('Veuillez saisir l\'ID ou l\'URL de votre feuille');
      return;
    }

    setIsLoading(true);
    try {
      // Extraire l'ID si c'est une URL complète
      let sheetId = input.trim();
      if (input.includes('docs.google.com')) {
        const extractedId = publicSheetsService.extractSheetId(input);
        if (!extractedId) {
          toast.error('URL Google Sheets invalide');
          return;
        }
        sheetId = extractedId;
      }

      // Charger les données de la feuille
      const sheetData = await publicSheetsService.getSheetData(sheetId);
      const sheetInfo = await publicSheetsService.getSheetInfo(sheetId);

      if (!sheetData.values || sheetData.values.length === 0) {
        toast.error('La feuille semble vide');
        return;
      }

      toast.success(`Feuille "${sheetInfo.title}" chargée avec succès`);
      onSheetLoaded(sheetId, { ...sheetData, info: sheetInfo });
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error(error.message || 'Erreur lors du chargement de la feuille');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileSpreadsheet className="h-5 w-5 mr-2" />
          Connecter votre Google Sheets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Comment rendre votre feuille accessible :</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Ouvrez votre Google Sheets</li>
              <li>Cliquez sur "Partager" en haut à droite</li>
              <li>Changez l'accès en "Visible par toute personne ayant le lien"</li>
              <li>Copiez l'URL ou l'ID de la feuille ci-dessous</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="sheet-input">URL ou ID de la feuille Google Sheets</Label>
          <Input
            id="sheet-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/VOTRE_ID/edit ou directement l'ID"
          />
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isLoading || !input.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⊚</span>
              Chargement...
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Charger la feuille
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• L'URL ressemble à : https://docs.google.com/spreadsheets/d/1ABC...xyz/edit</p>
          <p>• L'ID est la partie entre /d/ et /edit</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SheetIdInput;
