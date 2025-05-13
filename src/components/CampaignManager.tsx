import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, FilePlus } from "lucide-react";
import { toast } from "sonner";
import { Sheet, Campaign, AdGroup, Client, sheetService } from "@/services/googleSheetsService";
import ClientInfoCard from "./campaign/ClientInfoCard";
import CampaignForm from "./campaign/CampaignForm";
import CampaignTable from "./campaign/CampaignTable";
import ModelSelector from "./campaign/ModelSelector";
import LoadingState from "./campaign/LoadingState";
import SpreadsheetEditor from "./sheet/SpreadsheetEditor";

interface CampaignManagerProps {
  sheet: Sheet | null;
  onUpdateComplete: () => void;
}

const CampaignManager: React.FC<CampaignManagerProps> = ({ sheet, onUpdateComplete }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [clientInfo, setClientInfo] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4");
  const [viewMode, setViewMode] = useState<"form" | "table" | "spreadsheet">("table");
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
        
        // Extraire les campagnes à partir des données
        const loadedCampaigns = sheetService.extractCampaigns(sheet.id);
        setCampaigns(loadedCampaigns.length > 0 ? loadedCampaigns : [createEmptyCampaign()]);
      } else {
        // Initialiser avec des données vides
        setCampaigns([createEmptyCampaign()]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Impossible de charger les données de la feuille");
      setCampaigns([createEmptyCampaign()]);
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

  const createEmptyCampaign = (): Campaign => ({
    name: "",
    context: "",
    adGroups: [{
      name: "",
      keywords: ["", "", ""],
      context: ""
    }]
  });

  const addCampaign = () => {
    setCampaigns([...campaigns, createEmptyCampaign()]);
  };

  const removeCampaign = (index: number) => {
    const updatedCampaigns = [...campaigns];
    updatedCampaigns.splice(index, 1);
    
    // Toujours garder au moins une campagne
    if (updatedCampaigns.length === 0) {
      updatedCampaigns.push(createEmptyCampaign());
    }
    
    setCampaigns(updatedCampaigns);
  };

  const updateCampaignName = (index: number, name: string) => {
    const updatedCampaigns = [...campaigns];
    updatedCampaigns[index].name = name;
    setCampaigns(updatedCampaigns);
  };

  const updateCampaignContext = (index: number, context: string) => {
    const updatedCampaigns = [...campaigns];
    updatedCampaigns[index].context = context;
    setCampaigns(updatedCampaigns);
  };

  const addAdGroup = (campaignIndex: number) => {
    const updatedCampaigns = [...campaigns];
    updatedCampaigns[campaignIndex].adGroups.push({
      name: "",
      keywords: ["", "", ""],
      context: ""
    });
    setCampaigns(updatedCampaigns);
  };

  const removeAdGroup = (campaignIndex: number, adGroupIndex: number) => {
    const updatedCampaigns = [...campaigns];
    
    // Toujours garder au moins un groupe d'annonces par campagne
    if (updatedCampaigns[campaignIndex].adGroups.length > 1) {
      updatedCampaigns[campaignIndex].adGroups.splice(adGroupIndex, 1);
      setCampaigns(updatedCampaigns);
    } else {
      toast.info("Chaque campagne doit avoir au moins un groupe d'annonces");
    }
  };

  const updateAdGroupName = (campaignIndex: number, adGroupIndex: number, name: string) => {
    const updatedCampaigns = [...campaigns];
    updatedCampaigns[campaignIndex].adGroups[adGroupIndex].name = name;
    setCampaigns(updatedCampaigns);
  };

  const updateAdGroupContext = (campaignIndex: number, adGroupIndex: number, context: string) => {
    const updatedCampaigns = [...campaigns];
    updatedCampaigns[campaignIndex].adGroups[adGroupIndex].context = context;
    setCampaigns(updatedCampaigns);
  };

  const updateKeyword = (campaignIndex: number, adGroupIndex: number, keywordIndex: number, value: string) => {
    const updatedCampaigns = [...campaigns];
    
    // S'assurer que le tableau de mots-clés est initialisé et a la bonne taille
    while (updatedCampaigns[campaignIndex].adGroups[adGroupIndex].keywords.length <= keywordIndex) {
      updatedCampaigns[campaignIndex].adGroups[adGroupIndex].keywords.push("");
    }
    
    updatedCampaigns[campaignIndex].adGroups[adGroupIndex].keywords[keywordIndex] = value;
    setCampaigns(updatedCampaigns);
  };

  const saveCampaigns = async () => {
    if (!sheet) {
      toast.error("Aucune feuille sélectionnée");
      return;
    }

    // Validation des données
    for (let i = 0; i < campaigns.length; i++) {
      if (!campaigns[i].name.trim()) {
        toast.error(`La campagne ${i + 1} doit avoir un nom`);
        return;
      }
      
      for (let j = 0; j < campaigns[i].adGroups.length; j++) {
        if (!campaigns[i].adGroups[j].name.trim()) {
          toast.error(`Le groupe d'annonces ${j + 1} de la campagne "${campaigns[i].name}" doit avoir un nom`);
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      // Convertir les données en format adapté pour le tableur
      const sheetData = [];
      
      // Ajouter les en-têtes si c'est une nouvelle feuille
      if (!sheet) {
        const headers = [
          "Nom de la campagne",
          "Nom du groupe d'annonces",
          "Top 3 mots-clés",
          "Titre 1",
          "Titre 2",
          "Titre 3",
          "Titre 4",
          "Titre 5",
          "Titre 6",
          "Titre 7",
          "Titre 8",
          "Titre 9",
          "Titre 10",
          "Description 1",
          "Description 2",
          "Description 3",
          "Description 4",
          "Description 5"
        ];
        sheetData.push(headers);
      }
      
      // Ajouter les données des campagnes
      for (const campaign of campaigns) {
        for (const adGroup of campaign.adGroups) {
          const keywords = adGroup.keywords.filter(k => k.trim()).join(", ");
          sheetData.push([campaign.name, adGroup.name, keywords]);
        }
      }
      
      // Écrire les données dans la feuille
      const success = await sheetService.writeSheetData(
        sheet.id, 
        "Campagnes publicitaires!A2:C100", 
        sheetData
      );
      
      if (success) {
        toast.success("Données sauvegardées avec succès");
        onUpdateComplete();
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des données:", error);
      toast.error("Impossible de sauvegarder les données");
    } finally {
      setIsSaving(false);
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
        
        // Mettre à jour les campagnes en fonction des nouvelles données
        const loadedCampaigns = sheetService.extractCampaigns(sheet.id);
        setCampaigns(loadedCampaigns.length > 0 ? loadedCampaigns : [createEmptyCampaign()]);
        
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

    // Utiliser le contexte client déjà disponible
    const clientContext = clientInfo.businessContext + 
      (clientInfo.specifics ? ` ${clientInfo.specifics}` : '') + 
      (clientInfo.editorialGuidelines ? ` Style éditorial: ${clientInfo.editorialGuidelines}` : '');

    // Validation des données
    for (const campaign of campaigns) {
      if (!campaign.name.trim() || !campaign.context.trim()) {
        toast.error(`La campagne "${campaign.name || '(sans nom)'}" doit avoir un nom et un contexte`);
        return;
      }
      
      for (const adGroup of campaign.adGroups) {
        if (!adGroup.name.trim() || !adGroup.context.trim()) {
          toast.error(`Le groupe d'annonces "${adGroup.name || '(sans nom)'}" de la campagne "${campaign.name}" doit avoir un nom et un contexte`);
          return;
        }
        
        const validKeywords = adGroup.keywords.filter(k => k.trim());
        if (validKeywords.length < 1) {
          toast.error(`Le groupe d'annonces "${adGroup.name}" doit avoir au moins un mot-clé`);
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      // Générer le contenu pour chaque groupe d'annonces
      const sheetData = [];
      let rowIndex = 2; // Commencer à la ligne 2 (après les en-têtes)
      
      for (const campaign of campaigns) {
        for (const adGroup of campaign.adGroups) {
          const keywords = adGroup.keywords.filter(k => k.trim());
          
          // Générer les titres et descriptions
          const generatedContent = await sheetService.generateContent({
            clientContext,
            campaignContext: campaign.context,
            adGroupContext: adGroup.context,
            keywords,
            model: selectedModel
          });
          
          if (!generatedContent) {
            toast.error(`Erreur lors de la génération de contenu pour "${adGroup.name}"`);
            continue;
          }
          
          // Construire la ligne pour le tableur
          const row = [
            campaign.name,
            adGroup.name,
            keywords.join(", ")
          ];
          
          // Ajouter les titres
          generatedContent.titles.forEach((title, index) => {
            if (index < 10) row[index + 3] = title;
          });
          
          // Ajouter les descriptions
          generatedContent.descriptions.forEach((desc, index) => {
            if (index < 5) row[index + 13] = desc;
          });
          
          sheetData.push(row);
          
          // Écrire ligne par ligne pour voir les résultats en temps réel
          const range = `Campagnes publicitaires!A${rowIndex}:R${rowIndex}`;
          await sheetService.writeSheetData(sheet.id, range, [row]);
          rowIndex++;
        }
      }
      
      // Recharger les données du tableur
      loadInitialData();
      
      toast.success("Contenu généré et sauvegardé avec succès");
      onUpdateComplete();
    } catch (error) {
      console.error("Erreur lors de la génération de contenu:", error);
      toast.error("Impossible de générer le contenu");
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Campagnes et Groupes d'Annonces</h2>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "form" | "table" | "spreadsheet")} className="ml-4">
              <TabsList>
                <TabsTrigger value="table">Vue Tableau</TabsTrigger>
                <TabsTrigger value="form">Vue Formulaire</TabsTrigger>
                <TabsTrigger value="spreadsheet">Tableur</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            {viewMode === "table" && (
              <CampaignTable campaigns={campaigns} setCampaigns={setCampaigns} />
            )}
            
            {viewMode === "form" && (
              <>
                {campaigns.map((campaign, campaignIndex) => (
                  <CampaignForm
                    key={`campaign-${campaignIndex}`}
                    campaign={campaign}
                    onCampaignNameChange={(name) => updateCampaignName(campaignIndex, name)}
                    onCampaignContextChange={(context) => updateCampaignContext(campaignIndex, context)}
                    onAdGroupNameChange={(adGroupIndex, name) => updateAdGroupName(campaignIndex, adGroupIndex, name)}
                    onAdGroupContextChange={(adGroupIndex, context) => updateAdGroupContext(campaignIndex, adGroupIndex, context)}
                    onKeywordChange={(adGroupIndex, keywordIndex, value) => updateKeyword(campaignIndex, adGroupIndex, keywordIndex, value)}
                    onAddAdGroup={() => addAdGroup(campaignIndex)}
                    onRemoveAdGroup={(adGroupIndex) => removeAdGroup(campaignIndex, adGroupIndex)}
                    onRemoveCampaign={() => removeCampaign(campaignIndex)}
                    removable={campaigns.length > 1}
                  />
                ))}
                <Button onClick={addCampaign} size="sm" className="ml-auto block">
                  Ajouter une Campagne
                </Button>
              </>
            )}
            
            {viewMode === "spreadsheet" && sheetData && (
              <SpreadsheetEditor 
                data={sheetData} 
                sheetId={sheet.id}
                onSave={handleSpreadsheetSave}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <ModelSelector 
        selectedModel={selectedModel} 
        onModelSelect={setSelectedModel} 
      />

      <div className="flex justify-end space-x-4">
        {viewMode !== "spreadsheet" && (
          <Button
            variant="outline"
            onClick={saveCampaigns}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-1" />
            Sauvegarder
          </Button>
        )}
        <Button
          onClick={generateContent}
          disabled={isSaving || !clientInfo}
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
