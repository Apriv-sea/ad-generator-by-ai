
import { useState } from "react";
import { toast } from "sonner";
import { Sheet, Client, sheetService } from "@/services/sheetService";
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
            model: selectedModel,
            clientContext,
            campaignContext: campaign,
            adGroupContext: adGroup,
            keywords: keywords.slice(0, 3)
          }
        );

        if (result.success && result.titles && result.descriptions) {
          // Mettre à jour la ligne avec le contenu généré
          const updatedRow = [...row];
          
          // Colonnes pour les titres (index 3, 4, 5)
          if (result.titles && result.titles.length > 0) {
            result.titles.slice(0, 3).forEach((title, idx) => {
              if (title && title.trim()) {
                updatedRow[3 + idx] = title.trim();
              }
            });
          }

          // Colonnes pour les descriptions (index 6, 7)  
          if (result.descriptions && result.descriptions.length > 0) {
            result.descriptions.slice(0, 2).forEach((desc, idx) => {
              if (desc && desc.trim()) {
                updatedRow[6 + idx] = desc.trim();
              }
            });
          }

          updatedRows[i] = updatedRow;
        }
      }

      // Mettre à jour les données dans l'état et sauvegarder
      const newSheetData = [headers, ...updatedRows];
      setSheetData(newSheetData);
      
      // Sauvegarder dans CryptPad
      await sheetService.writeSheetData(sheet.id, newSheetData);
      
      toast.success("Contenu généré et sauvegardé avec succès !");
      onUpdateComplete();
      
    } catch (error) {
      console.error("Erreur lors de la génération:", error);
      toast.error("Erreur lors de la génération du contenu");
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
