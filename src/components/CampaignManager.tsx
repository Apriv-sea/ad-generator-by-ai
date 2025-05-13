
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilePlus } from "lucide-react";
import { toast } from "sonner";
import { Sheet, Client, sheetService } from "@/services/googleSheetsService";
import ClientInfoCard from "./campaign/ClientInfoCard";
import ModelSelector from "./campaign/ModelSelector";
import LoadingState from "./campaign/LoadingState";
import SpreadsheetEditor from "./sheet/SpreadsheetEditor";

interface CampaignManagerProps {
  sheet: Sheet | null;
  onUpdateComplete: () => void;
}

const CampaignManager: React.FC<CampaignManagerProps> = ({ sheet, onUpdateComplete }) => {
  const [clientInfo, setClientInfo] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4");
  const [sheetData, setSheetData] = useState<any[][] | null>(null);

  useEffect(() => {
    if (sheet) {
      loadInitialData();
      loadClientInfo();
    }
  }, [sheet]);

  const loadInitialData = async () => {
    if (!sheet) return;
    
    setIsLoading(true);
    try {
      // Charger les données existantes de la feuille
      const data = await sheetService.getSheetData(sheet.id);
      if (data && data.values && data.values.length > 0) {
        setSheetData(data.values);
      } else {
        // Initialiser avec des données vides
        setSheetData([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Impossible de charger les données de la feuille");
      setSheetData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClientInfo = async () => {
    if (!sheet) return;
    
    try {
      const client = await sheetService.getClientInfo(sheet.id);
      setClientInfo(client);
    } catch (error) {
      console.error("Erreur lors du chargement des informations client:", error);
    }
  };

  const handleSpreadsheetSave = async (data: any[][]) => {
    if (!sheet) {
      toast.error("Aucune feuille sélectionnée");
      return;
    }

    setIsSaving(true);
    try {
      // Enregistrer les données du tableur
      const success = await sheetService.writeSheetData(
        sheet.id,
        "", // Range ignoré dans l'implémentation locale
        data
      );
      
      if (success) {
        toast.success("Tableur sauvegardé avec succès");
        setSheetData(data);
        onUpdateComplete();
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du tableur:", error);
      toast.error("Impossible de sauvegarder le tableur");
    } finally {
      setIsSaving(false);
    }
  };

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

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row[0] || !row[1] || !row[2]) continue; // Ignorer les lignes vides
        
        const campaign = row[0];
        const adGroup = row[1];
        const keywords = row[2].split(',').map((k: string) => k.trim()).filter((k: string) => k);

        if (keywords.length === 0) continue;

        // Utiliser l'API pour générer des titres et descriptions
        const generatedContent = await sheetService.generateContent({
          clientContext,
          campaignContext: campaign,
          adGroupContext: adGroup,
          keywords,
          model: selectedModel
        });

        if (!generatedContent) continue;

        // Mettre à jour la ligne avec les titres et descriptions générés
        const updatedRow = [...row];
        // Ajouter les titres aux colonnes 3 à 12
        generatedContent.titles.forEach((title, index) => {
          if (index < 10) updatedRow[index + 3] = title;
        });
        
        // Ajouter les descriptions aux colonnes 13 à 17
        generatedContent.descriptions.forEach((desc, index) => {
          if (index < 5) updatedRow[index + 13] = desc;
        });
        
        updatedRows[i] = updatedRow;
        
        // Mettre à jour le tableau en temps réel
        const range = `Campagnes publicitaires!A${rowIndex}:R${rowIndex}`;
        await sheetService.writeSheetData(sheet.id, range, [updatedRow]);
        rowIndex++;
      }
      
      // Mettre à jour les données du tableur
      setSheetData([headers, ...updatedRows]);
      toast.success("Contenu généré avec succès");
    } catch (error) {
      console.error("Erreur lors de la génération du contenu:", error);
      toast.error("Erreur lors de la génération du contenu");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!sheet) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Sélectionnez une feuille pour commencer à gérer les campagnes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ClientInfoCard clientInfo={clientInfo} />

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4">Tableur des campagnes</h2>
          {sheetData && (
            <SpreadsheetEditor 
              data={sheetData} 
              sheetId={sheet.id}
              onSave={handleSpreadsheetSave}
            />
          )}
        </CardContent>
      </Card>

      <ModelSelector 
        selectedModel={selectedModel} 
        onModelSelect={setSelectedModel} 
      />

      <div className="flex justify-end">
        <Button
          onClick={generateContent}
          disabled={isSaving || !clientInfo || !sheetData || sheetData.length <= 1}
        >
          {isSaving ? (
            <>
              <span className="animate-spin mr-2">⊚</span>
              Génération...
            </>
          ) : (
            <>
              <FilePlus className="h-4 w-4 mr-1" />
              Générer le Contenu
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CampaignManager;
