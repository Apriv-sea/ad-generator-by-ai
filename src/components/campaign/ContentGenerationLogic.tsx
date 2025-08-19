
import { useState } from "react";
import { toast } from "sonner";
import { Sheet, Client, sheetService } from "@/services/sheetService";
import { enhancedContentGenerationService } from "@/services/content/enhancedContentGenerationService";
import { googleSheetsService } from "@/services/googlesheets/googleSheetsService";

interface UseContentGenerationProps {
  sheet: Sheet;
  clientInfo: Client | null;
  sheetData: any[][] | null;
  setSheetData: React.Dispatch<React.SetStateAction<any[][] | null>>;
  onUpdateComplete: () => void;
}

export const useContentGeneration = ({
  sheet,
  clientInfo,
  sheetData,
  setSheetData,
  onUpdateComplete
}: UseContentGenerationProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("claude-sonnet-4-20250514");

  const generateContent = async () => {
    if (!sheet) {
      toast.error("Aucune feuille sélectionnée");
      return;
    }

    if (!clientInfo || !clientInfo.businessContext) {
      toast.error("Impossible de récupérer le contexte client. Veuillez vérifier les informations du client.");
      return;
    }

    if (!sheetData || sheetData.length <= 1) {
      toast.error("Veuillez d'abord ajouter des campagnes et groupes d'annonces dans le tableur");
      return;
    }

    // Utiliser le contexte client déjà disponible avec les nouveaux champs
    const clientContext = clientInfo.businessContext + 
      (clientInfo.specifics ? ` ${clientInfo.specifics}` : '') + 
      (clientInfo.editorialGuidelines ? ` Style éditorial: ${clientInfo.editorialGuidelines}` : '');

    setIsSaving(true);
    try {
      console.log('🚀 === DEBUT GENERATION DE CONTENU ===');
      console.log('📋 Feuille:', sheet.id);
      console.log('📊 Données actuelles:', {
        totalRows: sheetData.length,
        headers: sheetData[0],
        dataRows: sheetData.length - 1
      });

      const headers = sheetData[0];
      const dataRows = sheetData.slice(1);
      let updatedRows = [...dataRows];
      let contentGeneratedCount = 0;

      // Créer un backup des données actuelles
      const backupData = JSON.parse(JSON.stringify(sheetData));

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row[0] || !row[1] || !row[2]) {
          console.log(`⏭️ Ligne ${i + 1} ignorée - données manquantes:`, row.slice(0, 3));
          continue;
        }
        
        const campaign = row[0];
        const adGroup = row[1];
        const keywords = row[2].split(',').map((k: string) => k.trim()).filter((k: string) => k);

        if (keywords.length === 0) {
          console.log(`⏭️ Ligne ${i + 1} ignorée - pas de mots-clés`);
          continue;
        }

        console.log(`🎯 Génération pour ligne ${i + 1}: ${campaign} > ${adGroup}`);
        console.log(`🔑 Mots-clés:`, keywords.slice(0, 3));

        // CORRECTION CRITIQUE: i correspond à l'index dans dataRows, donc i+1 correspond à l'index dans sheetData incluant les headers
        console.log(`📍 Index correction: i=${i}, rowIndex dans sheetData=${i + 1}`);
        
        // Utiliser le service principal pour générer du contenu
        const result = await enhancedContentGenerationService.generateContent(
          {
            model: selectedModel,
            clientContext,
            industry: clientInfo.industry,
            campaignContext: campaign,
            adGroupContext: adGroup,
            keywords: keywords.slice(0, 3)
          },
          sheet.id,
          [headers, ...updatedRows],
          {
            validateContent: true,
            saveToHistory: true,
            createBackup: false,
            autoCleanContent: true,
            maxRegenerateAttempts: 2
          }
        );
        
        console.log('✅ Retour service génération:', result);
        
        if (result.success && result.titles && result.descriptions) {
          console.log(`✅ Contenu généré pour ligne ${i + 1}`);
          
          // Intégrer le contenu généré dans la ligne
          const titres = result.titles || [];
          const descriptions = result.descriptions || [];
          
          // Mettre à jour la ligne avec le contenu généré
          for (let titleIndex = 0; titleIndex < 15 && titleIndex < titres.length; titleIndex++) {
            const columnIndex = 5 + titleIndex; // Commence à la colonne "Titre 1"
            if (columnIndex < updatedRows[i].length || columnIndex === updatedRows[i].length) {
              updatedRows[i][columnIndex] = titres[titleIndex];
            }
          }
          
          for (let descIndex = 0; descIndex < 4 && descIndex < descriptions.length; descIndex++) {
            const columnIndex = 20 + descIndex; // Commence à la colonne "Description 1"
            if (columnIndex < updatedRows[i].length || columnIndex === updatedRows[i].length) {
              updatedRows[i][columnIndex] = descriptions[descIndex];
            }
          }
          
          contentGeneratedCount++;
        } else {
          console.warn(`⚠️ Échec génération pour ligne ${i + 1}:`, result.error);
        }
      }

      // Mettre à jour les données dans l'état
      const newSheetData = [headers, ...updatedRows];
      console.log('📊 Nouvelles données préparées:', {
        totalRows: newSheetData.length,
        contentGeneratedForRows: contentGeneratedCount,
        headers: newSheetData[0],
        sampleUpdatedRow: newSheetData[1]
      });

      setSheetData(newSheetData);
      
      toast.success(`Contenu généré pour ${contentGeneratedCount} ligne(s) avec tous les 15 titres et 4 descriptions !`);
      onUpdateComplete();
      
    } catch (error) {
      console.error("❌ === ERREUR COMPLETE GENERATION ===", error);
      toast.error(`Erreur lors de la génération du contenu: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    generateContent,
    isSaving,
    selectedModel,
    setSelectedModel
  };
};
