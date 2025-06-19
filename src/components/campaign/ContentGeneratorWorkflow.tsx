
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Wand2, CheckCircle, AlertCircle } from "lucide-react";
import { Campaign, Client } from "@/services/types";
import { enhancedContentGenerationService } from "@/services/content/enhancedContentGenerationService";
import { toast } from "sonner";
import ModelSelector from "./ModelSelector";

interface ContentGeneratorWorkflowProps {
  sheetId: string;
  sheetData: any[][] | null;
  campaigns: Campaign[];
  clientInfo: Client | null;
}

const ContentGeneratorWorkflow: React.FC<ContentGeneratorWorkflowProps> = ({
  sheetId,
  sheetData,
  campaigns,
  clientInfo
}) => {
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState<string>("");

  const generateContent = async () => {
    if (!clientInfo?.businessContext) {
      toast.error("Contexte client manquant. Impossible de générer du contenu.");
      return;
    }

    if (!sheetData || sheetData.length <= 1) {
      toast.error("Données de feuille insuffisantes");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGenerationComplete(false);

    try {
      const clientContext = clientInfo.businessContext + 
        (clientInfo.specifics ? ` ${clientInfo.specifics}` : '') + 
        (clientInfo.editorialGuidelines ? ` Style: ${clientInfo.editorialGuidelines}` : '');

      const headers = sheetData[0];
      const dataRows = sheetData.slice(1);
      let updatedRows = [...dataRows];
      
      // Créer un backup
      const backupData = JSON.parse(JSON.stringify(sheetData));

      for (let i = 0; i < Math.min(campaigns.length, dataRows.length); i++) {
        const campaign = campaigns[i];
        setCurrentCampaign(`${campaign.campaignName} > ${campaign.adGroupName}`);
        
        const keywords = campaign.keywords.split(',').map(k => k.trim()).filter(k => k);
        
        if (keywords.length === 0) continue;

        console.log(`Génération pour: ${campaign.campaignName} > ${campaign.adGroupName}`);

        try {
          const result = await enhancedContentGenerationService.generateContent(
            {
              clientContext,
              campaignContext: campaign.campaignName,
              adGroupContext: campaign.adGroupName,
              keywords,
              model: selectedModel
            },
            sheetId,
            backupData,
            {
              validateContent: true,
              saveToHistory: true,
              createBackup: i === 0,
              autoCleanContent: true,
              maxRegenerateAttempts: 1
            }
          );

          if (result.success) {
            // Mettre à jour la ligne avec les résultats
            const updatedRow = [...dataRows[i]];
            
            // Ajouter les titres (colonnes 3-12)
            result.titles.forEach((title, index) => {
              if (index < 10) updatedRow[index + 3] = title;
            });
            
            // Ajouter les descriptions (colonnes 13-17)
            result.descriptions.forEach((desc, index) => {
              if (index < 5) updatedRow[index + 13] = desc;
            });
            
            updatedRows[i] = updatedRow;
          }

        } catch (error) {
          console.error(`Erreur génération ${campaign.campaignName}:`, error);
        }

        // Mettre à jour le progrès
        setProgress((i + 1) / campaigns.length * 100);
      }

      setGenerationComplete(true);
      setCurrentCampaign("");
      
      toast.success(`Génération terminée pour ${campaigns.length} campagnes !`);
      
      // Optionnel : Afficher un lien pour télécharger ou voir les résultats
      
    } catch (error) {
      console.error("Erreur lors de la génération:", error);
      toast.error("Erreur lors de la génération du contenu");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Génération de contenu par IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informations sur le client */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Client:</strong> {clientInfo?.name}<br/>
              <strong>Contexte:</strong> {clientInfo?.businessContext?.substring(0, 100)}...
            </AlertDescription>
          </Alert>

          {/* Sélection du modèle */}
          <div>
            <label className="block text-sm font-medium mb-2">Modèle d'IA</label>
            <ModelSelector 
              selectedModel={selectedModel} 
              onModelSelect={setSelectedModel} 
            />
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{campaigns.length}</div>
              <div className="text-sm text-blue-600">Campagnes à traiter</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{selectedModel}</div>
              <div className="text-sm text-green-600">Modèle sélectionné</div>
            </div>
          </div>

          {/* Génération */}
          {!generationComplete && (
            <Button
              onClick={generateContent}
              disabled={isGenerating || !clientInfo?.businessContext}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin mr-2">⊚</span>
                  Génération en cours...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Lancer la génération de contenu
                </>
              )}
            </Button>
          )}

          {/* Progrès */}
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">
                {currentCampaign && `En cours: ${currentCampaign}`}
              </p>
              <p className="text-xs text-gray-500 text-center">
                {Math.round(progress)}% terminé
              </p>
            </div>
          )}

          {/* Succès */}
          {generationComplete && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ✅ Génération terminée avec succès ! Le contenu a été intégré dans votre feuille CryptPad.
                <br/>
                <span className="text-sm text-gray-600">
                  Vous pouvez maintenant consulter votre feuille pour voir les titres et descriptions générés.
                </span>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentGeneratorWorkflow;
