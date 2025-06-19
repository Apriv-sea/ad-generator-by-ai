
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
  const [debugInfo, setDebugInfo] = useState<string>('');

  const testSheetAccess = async (sheetId: string) => {
    console.log('🔍 Test d\'accès à la feuille:', sheetId);
    
    // Test direct avec l'API Google
    const testUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:Z?key=AIzaSyBvOyisPCYH8IuFK-HuQUQy_MXA5UL6GSQ`;
    
    try {
      const response = await fetch(testUrl);
      console.log('📊 Réponse de l\'API:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      const responseText = await response.text();
      console.log('📄 Contenu de la réponse:', responseText.substring(0, 500));
      
      if (!response.ok) {
        setDebugInfo(`Erreur ${response.status}: ${response.statusText}\nRéponse: ${responseText.substring(0, 200)}`);
        
        if (response.status === 403) {
          throw new Error('🔒 Feuille non accessible publiquement. Statut: 403 Forbidden');
        }
        if (response.status === 400) {
          throw new Error('📝 Requête invalide. Vérifiez l\'ID de la feuille. Statut: 400 Bad Request');
        }
        if (response.status === 404) {
          throw new Error('❌ Feuille introuvable. Statut: 404 Not Found');
        }
        
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = JSON.parse(responseText);
      setDebugInfo(`✅ Succès! ${data.values?.length || 0} lignes trouvées`);
      return data;
      
    } catch (error) {
      console.error('❌ Erreur lors du test:', error);
      setDebugInfo(`Erreur: ${error.message}`);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast.error('Veuillez saisir l\'ID ou l\'URL de votre feuille');
      return;
    }

    setIsLoading(true);
    setDebugInfo('🔄 Test en cours...');
    
    try {
      // Extraire l'ID si c'est une URL complète
      let sheetId = input.trim();
      if (input.includes('docs.google.com')) {
        const extractedId = publicSheetsService.extractSheetId(input);
        if (!extractedId) {
          toast.error('URL Google Sheets invalide');
          setDebugInfo('❌ URL invalide');
          return;
        }
        sheetId = extractedId;
      }

      console.log('🎯 ID extrait:', sheetId);
      setDebugInfo(`ID extrait: ${sheetId}`);

      // Test d'accès direct
      const testResult = await testSheetAccess(sheetId);
      
      // Si le test réussit, charger via le service
      const sheetData = await publicSheetsService.getSheetData(sheetId);
      const sheetInfo = await publicSheetsService.getSheetInfo(sheetId);

      if (!sheetData.values || sheetData.values.length === 0) {
        toast.error('La feuille semble vide');
        setDebugInfo('⚠️ Feuille vide');
        return;
      }

      toast.success(`Feuille "${sheetInfo.title}" chargée avec succès`);
      setDebugInfo(`✅ Chargée: ${sheetInfo.title}`);
      onSheetLoaded(sheetId, { ...sheetData, info: sheetInfo });
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error(error.message || 'Erreur lors du chargement de la feuille');
    } finally {
      setIsLoading(false);
    }
  };

  // Test avec l'URL fournie par l'utilisateur
  const testUserSheet = async () => {
    const userSheetId = '1uawoG2RorJDRrWtdLHEe9AD7sIoRWmp9h_vAAtr5vVI';
    setInput(userSheetId);
    setDebugInfo('🎯 Test de la feuille utilisateur...');
    
    try {
      await testSheetAccess(userSheetId);
    } catch (error) {
      console.error('Test de la feuille utilisateur échoué:', error);
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
            Test feuille utilisateur
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
          <p>• ID de votre feuille: 1uawoG2RorJDRrWtdLHEe9AD7sIoRWmp9h_vAAtr5vVI</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SheetIdInput;
