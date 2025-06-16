
import { useState } from "react";
import { toast } from "sonner";
import { Sheet, Client, sheetService } from "@/services/googleSheetsService";
import { enhancedContentGenerationService } from "@/services/content/enhancedContentGenerationService";

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
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4");

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

    // Utiliser le contexte client déjà disponible
    const clientContext = clientInfo.businessContext + 
      (clientInfo.specifics ? ` ${clientInfo.specifics}` : '') + 
      (clientInfo.editorialGuidelines ? ` Style éditorial: ${clientInfo.editorialGuidelines}` : '');

    setIsSaving(true);
    try {
      const headers = sheetData[0];
      const dataRows = sheetData.slice(1);
      let updatedRows = [...dataRows];
      let rowIndex = 2; // Commencer à la ligne 2 (après les en-têtes)

      // Créer un backup des données actuelles
      const backupData = JSON.parse(JSON.stringify(sheetData));

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row[0] || !row[1] || !row[2]) continue; // Ignorer les lignes vides
        
        const campaign = row[0];
        const adGroup = row[1];
        const keywords = row[2].split(',').map((k: string) => k.trim()).filter((k: string) => k);

        if (keywords.length === 0) continue;

        console.log(`Génération pour: ${campaign} > ${adGroup}`);

        // Utiliser le service amélioré pour générer du contenu
        const result = await enhancedContentGenerationService.generateContent(
          {
            clientContext,
            campaignContext: campaign,
            adGroupContext: adGroup,
            keywords,
            model: selectedModel
          },
          sheet.id,
          backupData,
          {
            validateContent: true,
            saveToHistory: true,
            createBackup: i === 0, // Créer un backup seulement pour la première ligne
            autoCleanContent: true,
            maxRegenerateAttempts: 1 // Limiter pour éviter les timeouts
          }
        );

        if (!result.success) {
          console.error(`Échec de génération pour ${campaign} > ${adGroup}`);
          continue;
        }

        // Mettre à jour la ligne avec les titres et descriptions générés
        const updatedRow = [...row];
        
        // Ajouter les titres aux colonnes 3 à 12
        result.titles.forEach((title, index) => {
          if (index < 10) updatedRow[index + 3] = title;
        });
        
        // Ajouter les descriptions aux colonnes 13 à 17
        result.descriptions.forEach((desc, index) => {
          if (index < 5) updatedRow[index + 13] = desc;
        });
        
        updatedRows[i] = updatedRow;
        
        // Mettre à jour le tableau en temps réel
        try {
          const range = `Campagnes publicitaires!A${rowIndex}:R${rowIndex}`;
          await sheetService.writeSheetData(sheet.id, range, [updatedRow]);
        } catch (writeError) {
          console.error("Erreur d'écriture dans le sheet:", writeError);
          // Continuer même si l'écriture échoue
        }
        
        rowIndex++;

        // Afficher les résultats de validation s'il y en a
        if (result.validationResults) {
          const warnings = [
            ...result.validationResults.titles.warnings,
            ...result.validationResults.descriptions.warnings
          ];
          
          if (warnings.length > 0) {
            console.log(`Avertissements pour ${campaign} > ${adGroup}:`, warnings);
          }
        }
      }
      
      // Mettre à jour les données du tableur localement
      setSheetData([headers, ...updatedRows]);
      
      // Afficher les statistiques
      const stats = enhancedContentGenerationService.getStatsForSheet(sheet.id);
      console.log("Statistiques de génération:", stats);
      
      toast.success(`Contenu généré avec succès ! ${stats.totalGenerations} générations au total.`);
      onUpdateComplete();
      
    } catch (error) {
      console.error("Erreur lors de la génération du contenu:", error);
      toast.error(`Erreur lors de la génération du contenu: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    selectedModel,
    setSelectedModel,
    generateContent
  };
};
