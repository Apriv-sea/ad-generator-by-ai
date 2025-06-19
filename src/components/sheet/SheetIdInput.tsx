
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { extractSheetId, validateSheetId } from "@/services/sheets/sheetValidationService";
import { getSheetData, getSheetInfo } from "@/services/sheets/googleSheetsApiService";
import SheetInstructions from "./SheetInstructions";
import SheetInputForm from "./SheetInputForm";
import SheetActionButtons from "./SheetActionButtons";
import SheetDebugInfo from "./SheetDebugInfo";
import SheetHelpText from "./SheetHelpText";

interface SheetIdInputProps {
  onSheetLoaded: (sheetId: string, data: any) => void;
}

const SheetIdInput: React.FC<SheetIdInputProps> = ({ onSheetLoaded }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast.error('Veuillez saisir l\'ID ou l\'URL de votre feuille');
      return;
    }

    setIsLoading(true);
    setDebugInfo('🔄 Extraction de l\'ID...');
    
    try {
      const sheetId = extractSheetId(input);
      if (!sheetId) {
        toast.error('URL ou ID invalide');
        setDebugInfo('❌ Impossible d\'extraire l\'ID');
        return;
      }

      if (!validateSheetId(sheetId)) {
        toast.error('Format d\'ID invalide');
        setDebugInfo('❌ Format d\'ID invalide');
        return;
      }

      console.log('🎯 ID extrait et validé:', sheetId);
      setDebugInfo(`✅ ID extrait: ${sheetId}`);

      setDebugInfo('📊 Chargement des données...');
      const sheetData = await getSheetData(sheetId);
      
      if (!sheetData.values || sheetData.values.length === 0) {
        toast.error('La feuille semble vide');
        setDebugInfo('⚠️ Feuille vide');
        return;
      }

      const sheetInfo = await getSheetInfo(sheetId);

      toast.success(`Feuille "${sheetInfo.title}" chargée avec succès`);
      setDebugInfo(`✅ Chargée: ${sheetInfo.title} (${sheetData.values.length} lignes)`);
      onSheetLoaded(sheetId, { ...sheetData, info: sheetInfo });
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      
      if (error.message?.includes('Clé API Google non configurée')) {
        toast.error('Veuillez configurer votre clé API Google dans les paramètres');
        setDebugInfo('❌ Clé API Google manquante');
      } else {
        toast.error(error.message || 'Erreur lors du chargement de la feuille');
        setDebugInfo(`❌ Erreur: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testUserSheet = () => {
    const userSheetId = '1uawoG2RorJDRrWtdLHEe9AD7sIoRWmp9h_vAAtr5vVI';
    setInput(userSheetId);
    setDebugInfo('🎯 ID utilisateur prêt pour le test');
  };

  const goToSettings = () => {
    window.location.href = '/settings';
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
        <SheetInstructions />
        
        <SheetInputForm
          input={input}
          onInputChange={setInput}
        />

        <SheetActionButtons
          onSubmit={handleSubmit}
          onTestUserSheet={testUserSheet}
          onGoToSettings={goToSettings}
          isLoading={isLoading}
          hasInput={!!input.trim()}
        />

        <SheetDebugInfo debugInfo={debugInfo} />
        
        <SheetHelpText />
      </CardContent>
    </Card>
  );
};

export default SheetIdInput;
