
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { extractPadId, validatePadId } from "@/services/sheets/cryptpadValidationService";
import { cryptpadService } from "@/services/cryptpad/cryptpadService";
import CryptPadInstructions from "./CryptPadInstructions";
import CryptPadInputForm from "./CryptPadInputForm";
import CryptPadActionButtons from "./CryptPadActionButtons";
import SheetDebugInfo from "./SheetDebugInfo";
import CryptPadHelpText from "./CryptPadHelpText";

interface CryptPadIdInputProps {
  onSheetLoaded: (padId: string, data: any) => void;
}

const CryptPadIdInput: React.FC<CryptPadIdInputProps> = ({ onSheetLoaded }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast.error('Veuillez saisir l\'ID ou l\'URL de votre feuille CryptPad');
      return;
    }

    setIsLoading(true);
    setDebugInfo('🔄 Extraction de l\'ID...');
    
    try {
      const padId = extractPadId(input);
      if (!padId) {
        toast.error('URL ou ID invalide');
        setDebugInfo('❌ Impossible d\'extraire l\'ID');
        return;
      }

      if (!validatePadId(padId)) {
        toast.error('Format d\'ID invalide');
        setDebugInfo('❌ Format d\'ID invalide');
        return;
      }

      console.log('🎯 ID extrait et validé:', padId);
      setDebugInfo(`✅ ID extrait: ${padId}`);

      setDebugInfo('📊 Chargement des données...');
      const sheetData = await cryptpadService.getSheetData(padId);
      
      if (!sheetData.values || sheetData.values.length === 0) {
        toast.error('La feuille semble vide');
        setDebugInfo('⚠️ Feuille vide');
        return;
      }

      const padInfo = await cryptpadService.getPadInfo(padId);

      toast.success(`Feuille "${padInfo.title}" chargée avec succès`);
      setDebugInfo(`✅ Chargée: ${padInfo.title} (${sheetData.values.length} lignes)`);
      onSheetLoaded(padId, { ...sheetData, info: padInfo });
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error(error.message || 'Erreur lors du chargement de la feuille');
      setDebugInfo(`❌ Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const openCryptPad = () => {
    window.open('https://cryptpad.fr/sheet/', '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileSpreadsheet className="h-5 w-5 mr-2" />
          Connecter votre feuille CryptPad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CryptPadInstructions />
        
        <CryptPadInputForm
          input={input}
          onInputChange={setInput}
        />

        <CryptPadActionButtons
          onSubmit={handleSubmit}
          onOpenCryptPad={openCryptPad}
          isLoading={isLoading}
          hasInput={!!input.trim()}
        />

        <SheetDebugInfo debugInfo={debugInfo} />
        
        <CryptPadHelpText />
      </CardContent>
    </Card>
  );
};

export default CryptPadIdInput;
