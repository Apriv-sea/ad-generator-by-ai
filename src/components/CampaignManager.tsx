
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Save, FilePlus } from "lucide-react";
import { toast } from "sonner";
import { Sheet, Campaign, AdGroup, Client, googleSheetsService } from "@/services/googleSheetsService";
import ClientInfoCard from "./campaign/ClientInfoCard";
import CampaignForm from "./campaign/CampaignForm";
import ModelSelector from "./campaign/ModelSelector";
import LoadingState from "./campaign/LoadingState";

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
      const data = await googleSheetsService.getSheetData(sheet.id);
      if (data && data.values && data.values.length > 1) {
        const rawData = data.values.slice(1); // Ignorer les en-têtes
        
        // Grouper par campagne
        const campaignMap = new Map<string, any[]>();
        rawData.forEach((row: any[]) => {
          if (row.length >= 3 && row[0]) {
            const campaignName = row[0];
            if (!campaignMap.has(campaignName)) {
              campaignMap.set(campaignName, []);
            }
            campaignMap.get(campaignName)?.push(row);
          }
        });
        
        // Convertir en structure de données
        const loadedCampaigns: Campaign[] = [];
        campaignMap.forEach((rows, campaignName) => {
          const adGroups: AdGroup[] = [];
          const processedAdGroups = new Set<string>();
          
          rows.forEach(row => {
            if (row.length >= 3 && row[1] && !processedAdGroups.has(row[1])) {
              const adGroupName = row[1];
              processedAdGroups.add(adGroupName);
              
              // Extraire les mots-clés
              const keywords = row[2] ? row[2].split(',').map((k: string) => k.trim()).filter((k: string) => k) : [];
              
              adGroups.push({
                name: adGroupName,
                keywords: keywords.length > 0 ? keywords : [""],
                context: ""
              });
            }
          });
          
          loadedCampaigns.push({
            name: campaignName,
            adGroups,
            context: ""
          });
        });
        
        setCampaigns(loadedCampaigns.length > 0 ? loadedCampaigns : [createEmptyCampaign()]);
      } else {
        // Initialiser avec une campagne vide
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
      const client = await googleSheetsService.getClientInfo(sheet.id);
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
      // Convertir les données en format adapté pour Google Sheets
      const sheetData = [];
      
      for (const campaign of campaigns) {
        for (const adGroup of campaign.adGroups) {
          const keywords = adGroup.keywords.filter(k => k.trim()).join(", ");
          sheetData.push([campaign.name, adGroup.name, keywords]);
        }
      }
      
      // Écrire les données dans la feuille
      const success = await googleSheetsService.writeSheetData(
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
          const generatedContent = await googleSheetsService.generateContent({
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
          
          // Construire la ligne pour Google Sheets
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
          await googleSheetsService.writeSheetData(sheet.id, range, [row]);
          rowIndex++;
        }
      }
      
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
            <Button onClick={addCampaign} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter une Campagne
            </Button>
          </div>
          
          <div className="space-y-6">
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
          </div>
        </CardContent>
      </Card>

      <ModelSelector 
        selectedModel={selectedModel} 
        onModelSelect={setSelectedModel} 
      />

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={saveCampaigns}
          disabled={isSaving}
        >
          <Save className="h-4 w-4 mr-1" />
          Sauvegarder
        </Button>
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
