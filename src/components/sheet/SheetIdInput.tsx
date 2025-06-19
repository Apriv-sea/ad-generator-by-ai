
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileSpreadsheet, Info } from "lucide-react";
import { toast } from "sonner";
import { publicSheetsService } from "@/services/google/publicSheetsService";

interface SheetIdInputProps {
  onSheetLoaded: (sheetId: string, data: any) => void;
}

const SheetIdInput: React.FC<SheetIdInputProps> = ({ onSheetLoaded }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const extractSheetId = (input: string): string | null => {
    // Si c'est déjà juste un ID
    if (!input.includes('docs.google.com')) {
      return input.trim();
    }
    
    // Extraction depuis l'URL complète
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast.error('Veuillez saisir l\'ID ou l\'URL de votre feuille');
      return;
    }

    setIsLoading(true);
    setDebugInfo('🔄 Extraction de l\'ID...');
    
    try {
      // Extraire l'ID
      const sheetId = extractSheetId(input);
      if (!sheetId) {
        toast.error('URL ou ID invalide');
        setDebugInfo('❌ Impossible d\'extraire l\'ID');
        return;
      }

      console.log('🎯 ID extrait:', sheetId);
      setDebugInfo(`✅ ID extrait: ${sheetId}`);

      // Charger les données via le service
      setDebugInfo('📊 Chargement des données...');
      const sheetData = await publicSheetsService.getSheetData(sheetId);
      
      if (!sheetData.values || sheetData.values.length === 0) {
        toast.error('La feuille semble vide');
        setDebugInfo('⚠️ Feuille vide');
        return;
      }

      // Charger les infos de la feuille
      const sheetInfo = await publicSheetsService.getSheetInfo(sheetId);

      toast.success(`Feuille "${sheetInfo.title}" chargée avec succès`);
      setDebugInfo(`✅ Chargée: ${sheetInfo.title} (${sheetData.values.length} lignes)`);
      onSheetLoaded(sheetId, { ...sheetData, info: sheetInfo });
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      
      let errorMessage = 'Erreur lors du chargement de la feuille';
      if (error.message?.includes('403')) {
        errorMessage = 'Feuille non accessible. Vérifiez qu\'elle est partagée publiquement.';
      } else if (error.message?.includes('404')) {
        errorMessage = 'Feuille introuvable. Vérifiez l\'ID de la feuille.';
      } else if (error.message?.includes('400')) {
        errorMessage = 'Requête invalide. Vérifiez que la feuille est bien partagée publiquement.';
      }
      
      toast.error(errorMessage);
      setDebugInfo(`❌ Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test rapide avec l'ID utilisateur
  const testUserSheet = () => {
    const userSheetId = '1uawoG2RorJDRrWtdLHEe9AD7sIoRWmp9h_vAAtr5vVI';
    setInput(userSheetId);
    setDebugInfo('🎯 ID utilisateur prêt pour le test');
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

        <div className="flex gap-2">
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !input.trim()}
            className="flex-1"
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
          
          <Button 
            onClick={testUserSheet}
            variant="outline"
            size="sm"
          >
            Test ID utilisateur
          </Button>
        </div>

        {debugInfo && (
          <Alert>
            <AlertDescription>
              <strong>Debug:</strong><br/>
              <pre className="text-xs mt-1 whitespace-pre-wrap">{debugInfo}</pre>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• L'URL ressemble à : https://docs.google.com/spreadsheets/d/1ABC...xyz/edit</p>
          <p>• L'ID est la partie entre /d/ et /edit</p>
          <p>• Votre ID: 1uawoG2RorJDRrWtdLHEe9AD7sIoRWmp9h_vAAtr5vVI</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SheetIdInput;
