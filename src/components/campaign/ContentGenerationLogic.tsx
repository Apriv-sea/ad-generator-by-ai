
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

        // Utiliser le service amélioré pour générer du contenu
        const result = await enhancedContentGenerationService.generateContent(
          {
            model: selectedModel,
            clientContext,
            campaignContext: campaign,
            adGroupContext: adGroup,
            keywords: keywords.slice(0, 3)
          },
          sheet.id,
          backupData
        );

        if (result.success && result.titles && result.descriptions) {
          console.log(`✅ Contenu généré pour ligne ${i + 1}:`, {
            titlesCount: result.titles.length,
            descriptionsCount: result.descriptions.length,
            titles: result.titles,
            descriptions: result.descriptions
          });

          // Mettre à jour la ligne avec le contenu généré
          const updatedRow = [...row];
          
          // Colonnes pour les titres (index 3, 4, 5)
          if (result.titles && result.titles.length > 0) {
            result.titles.slice(0, 3).forEach((title, idx) => {
              if (title && title.trim()) {
                updatedRow[3 + idx] = title.trim();
                console.log(`📝 Titre ${idx + 1} ajouté: "${title.trim()}"`);
              }
            });
          }

          // Colonnes pour les descriptions (index 6, 7)  
          if (result.descriptions && result.descriptions.length > 0) {
            result.descriptions.slice(0, 2).forEach((desc, idx) => {
              if (desc && desc.trim()) {
                updatedRow[6 + idx] = desc.trim();
                console.log(`📝 Description ${idx + 1} ajoutée: "${desc.trim()}"`);
              }
            });
          }

          updatedRows[i] = updatedRow;
          contentGeneratedCount++;
        } else {
          console.warn(`⚠️ Échec génération pour ligne ${i + 1}:`, result);
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
      
      // Sauvegarder selon le type de feuille
      if (sheet.id.startsWith('sheet_')) {
        // Feuille locale - sauvegarder dans localStorage
        console.log('💾 Sauvegarde locale...');
        localStorage.setItem(`sheet_data_${sheet.id}`, JSON.stringify({ values: newSheetData }));
        console.log('✅ Sauvegarde locale terminée');
      } else {
        // Feuille Google Sheets - sauvegarder via l'API
        console.log('📊 Sauvegarde Google Sheets...');
        try {
          const saveSuccess = await googleSheetsService.saveSheetData(sheet.id, newSheetData);
          if (saveSuccess) {
            console.log('✅ Sauvegarde Google Sheets réussie');
          } else {
            console.warn('⚠️ Sauvegarde Google Sheets incertaine');
          }
        } catch (saveError) {
          console.error('❌ Erreur sauvegarde Google Sheets:', saveError);
          toast.error(`Contenu généré mais erreur de sauvegarde: ${saveError.message}`);
          // On continue quand même car le contenu a été généré
        }
      }
      
      toast.success(`Contenu généré pour ${contentGeneratedCount} ligne(s) et sauvegardé avec succès !`);
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
