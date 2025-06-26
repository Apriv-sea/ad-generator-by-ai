
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Wand2, CheckCircle, AlertCircle, Save, RefreshCw } from "lucide-react";
import { Campaign, Client } from "@/services/types";
import { enhancedContentGenerationService } from "@/services/content/enhancedContentGenerationService";
import { autoSaveService } from "@/services/storage/autoSaveService";
import { dataValidationService } from "@/services/validation/dataValidationService";
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
  const [generationResults, setGenerationResults] = useState<{
    success: number;
    failed: number;
    total: number;
  }>({ success: 0, failed: 0, total: 0 });
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>("");

  // Vérifier l'état de sauvegarde automatique
  useEffect(() => {
    const updateAutoSaveStatus = () => {
      const status = autoSaveService.getSheetStatus(sheetId);
      if (status.hasPending) {
        setAutoSaveStatus(`Sauvegarde en cours... (${status.status})`);
      } else {
        setAutoSaveStatus("Toutes les modifications sont sauvegardées");
      }
    };

    updateAutoSaveStatus();
    const interval = setInterval(updateAutoSaveStatus, 5000);
    
    return () => clearInterval(interval);
  }, [sheetId]);

  // Validation des prérequis
  const validatePrerequisites = () => {
    const errors: string[] = [];

    if (!clientInfo?.businessContext) {
      errors.push("Contexte client manquant");
    }

    if (!sheetData || sheetData.length <= 1) {
      errors.push("Données de feuille insuffisantes");
    }

    const campaignValidation = dataValidationService.validateCampaigns(campaigns);
    if (!campaignValidation.isValid) {
      errors.push(...campaignValidation.errors);
    }

    return errors;
  };

  const generateContent = async () => {
    const validationErrors = validatePrerequisites();
    if (validationErrors.length > 0) {
      toast.error(`Impossible de démarrer: ${validationErrors.join(', ')}`);
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGenerationComplete(false);
    setGenerationResults({ success: 0, failed: 0, total: campaigns.length });

    try {
      const clientContext = clientInfo!.businessContext + 
        (clientInfo!.specifics ? ` ${clientInfo!.specifics}` : '') + 
        (clientInfo!.editorialGuidelines ? ` Style: ${clientInfo!.editorialGuidelines}` : '');

      const headers = sheetData![0];
      const dataRows = sheetData!.slice(1);
      let updatedRows = [...dataRows];
      
      // Créer un backup
      const backupData = JSON.parse(JSON.stringify(sheetData));

      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < Math.min(campaigns.length, dataRows.length); i++) {
        const campaign = campaigns[i];
        setCurrentCampaign(`${campaign.campaignName} > ${campaign.adGroupName}`);
        
        const keywords = campaign.keywords.split(',').map(k => k.trim()).filter(k => k);
        
        if (keywords.length === 0) {
          failedCount++;
          setGenerationResults({ success: successCount, failed: failedCount, total: campaigns.length });
          continue;
        }

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
            
            // Ajouter les titres (colonnes 5-7 dans le nouveau format)
            result.titles.forEach((title, index) => {
              if (index < 3) updatedRow[index + 5] = title;
            });
            
            // Ajouter les descriptions (colonnes 8-9)
            result.descriptions.forEach((desc, index) => {
              if (index < 2) updatedRow[index + 8] = desc;
            });
            
            updatedRows[i] = updatedRow;
            successCount++;
          } else {
            failedCount++;
          }

        } catch (error) {
          console.error(`Erreur génération ${campaign.campaignName}:`, error);
          failedCount++;
        }

        // Mettre à jour le progrès et les résultats
        setProgress((i + 1) / campaigns.length * 100);
        setGenerationResults({ success: successCount, failed: failedCount, total: campaigns.length });

        // Sauvegarde automatique intermédiaire (toutes les 5 campagnes)
        if ((i + 1) % 5 === 0) {
          const intermediateData = [headers, ...updatedRows];
          autoSaveService.scheduleAutoSave(sheetId, intermediateData);
          toast.info(`Sauvegarde intermédiaire (${i + 1}/${campaigns.length})`);
        }
      }

      // Sauvegarde finale
      const finalData = [headers, ...updatedRows];
      const saveSuccess = await autoSaveService.forceSave(sheetId, finalData);
      
      setGenerationComplete(true);
      setCurrentCampaign("");
      
      if (saveSuccess) {
        toast.success(
          `Génération terminée ! ${successCount} réussie(s), ${failedCount} échouée(s). Données sauvegardées.`
        );
      } else {
        toast.warning(
          `Génération terminée ! ${successCount} réussie(s), ${failedCount} échouée(s). Problème de sauvegarde.`
        );
      }
      
    } catch (error) {
      console.error("Erreur lors de la génération:", error);
      toast.error("Erreur lors de la génération du contenu");
    } finally {
      setIsGenerating(false);
    }
  };

  const manualSave = async () => {
    if (!sheetData) return;
    
    toast.info("Sauvegarde manuelle en cours...");
    const success = await autoSaveService.forceSave(sheetId, sheetData);
    
    if (success) {
      toast.success("Sauvegarde manuelle réussie !");
    } else {
      toast.error("Échec de la sauvegarde manuelle");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Génération de contenu par IA</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {autoSaveStatus}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={manualSave}
                disabled={isGenerating}
              >
                <Save className="h-4 w-4 mr-1" />
                Sauvegarder
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Validation des prérequis */}
          {(() => {
            const errors = validatePrerequisites();
            return errors.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700">
                  <strong>Prérequis manquants:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            );
          })()}

          {/* Informations sur le client */}
          {clientInfo && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Client:</strong> {clientInfo.name}<br/>
                <strong>Contexte:</strong> {clientInfo.businessContext?.substring(0, 100)}...
              </AlertDescription>
            </Alert>
          )}

          {/* Sélection du modèle */}
          <div>
            <label className="block text-sm font-medium mb-2">Modèle d'IA</label>
            <ModelSelector 
              selectedModel={selectedModel} 
              onModelSelect={setSelectedModel} 
            />
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{campaigns.length}</div>
              <div className="text-sm text-blue-600">Campagnes à traiter</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{generationResults.success}</div>
              <div className="text-sm text-green-600">Réussies</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{generationResults.failed}</div>
              <div className="text-sm text-red-600">Échouées</div>
            </div>
          </div>

          {/* Génération */}
          {!generationComplete && (
            <Button
              onClick={generateContent}
              disabled={isGenerating || validatePrerequisites().length > 0}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
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
                {Math.round(progress)}% terminé - {generationResults.success} réussies, {generationResults.failed} échouées
              </p>
            </div>
          )}

          {/* Succès */}
          {generationComplete && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ✅ Génération terminée avec succès ! 
                <br/>
                <strong>Résultats:</strong> {generationResults.success} réussie(s), {generationResults.failed} échouée(s)
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
