
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Wand2, CheckCircle, AlertCircle, RefreshCw, Settings } from "lucide-react";
import { Campaign, Client } from "@/services/types";
import { enhancedContentGenerationService } from "@/services/content/enhancedContentGenerationService";
import { googleSheetsCoreService } from "@/services/core/googleSheetsCore";
import { CampaignContextService } from "@/services/campaign/campaignContextService";
import { CampaignContextForm } from "./CampaignContextForm";
import { toast } from "sonner";
import ModelSelector from "./ModelSelector";

interface ContentGeneratorWorkflowProps {
  sheetId: string;
  campaigns: any[];
  clientInfo: Client | null;
}

const ContentGeneratorWorkflow: React.FC<ContentGeneratorWorkflowProps> = ({
  sheetId,
  campaigns,
  clientInfo
}) => {
  const [selectedModel, setSelectedModel] = useState<string>("claude-sonnet-4-20250514");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState<string>("");
  const [showCampaignContextForm, setShowCampaignContextForm] = useState(false);
  const [detectedCampaigns, setDetectedCampaigns] = useState<string[]>([]);
  const [campaignContextsReady, setCampaignContextsReady] = useState(false);
  const [generationResults, setGenerationResults] = useState<{
    success: number;
    failed: number;
    total: number;
    details: { campaign: string; status: 'success' | 'failed'; error?: string }[];
  }>({ success: 0, failed: 0, total: 0, details: [] });

  // Détection des campagnes au chargement
  useEffect(() => {
    const detectCampaigns = async () => {
      if (sheetId && campaigns.length > 0) {
        try {
          const sheetData = await googleSheetsCoreService.getSheetData(sheetId);
          if (sheetData?.values) {
            const campaignNames = CampaignContextService.extractCampaignNames(sheetData.values);
            setDetectedCampaigns(campaignNames);
            
            // Vérifier si des contextes existent déjà
            const areComplete = CampaignContextService.areContextsComplete(campaignNames);
            setCampaignContextsReady(areComplete);
            
            console.log('🏷️ Campagnes détectées:', {
              campaignNames,
              contextesComplets: areComplete
            });
          }
        } catch (error) {
          console.error('❌ Erreur détection campagnes:', error);
        }
      }
    };

    detectCampaigns();
  }, [sheetId, campaigns]);

  const validatePrerequisites = () => {
    const errors: string[] = [];

    if (!clientInfo) {
      errors.push("Aucun client sélectionné");
    } else if (!clientInfo.businessContext?.trim()) {
      errors.push("Le contexte métier du client est requis");
    }

    if (campaigns.length === 0) {
      errors.push("Aucune campagne extraite");
    }

    if (detectedCampaigns.length > 0 && !campaignContextsReady) {
      errors.push("Les contextes des campagnes doivent être renseignés");
    }

    return errors;
  };

  const handleCampaignContextsSave = (contexts: Record<string, string>) => {
    CampaignContextService.saveContexts(contexts);
    setCampaignContextsReady(true);
    setShowCampaignContextForm(false);
    toast.success('Contextes des campagnes sauvegardés');
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
    setGenerationResults({ success: 0, failed: 0, total: campaigns.length, details: [] });

    try {
      const clientContext = clientInfo!.businessContext + 
        (clientInfo!.specifics ? ` ${clientInfo!.specifics}` : '') + 
        (clientInfo!.editorialGuidelines ? ` Style: ${clientInfo!.editorialGuidelines}` : '');

      console.log(`🚀 === DEBUT GENERATION WORKFLOW COMPLET ===`);
      console.log(`📋 Feuille ID: ${sheetId}`);
      console.log(`🎯 Modèle sélectionné: ${selectedModel}`);
      console.log(`📊 Campagnes à traiter: ${campaigns.length}`);

      // Récupérer les données actuelles de la feuille
      const currentSheetData = await googleSheetsCoreService.getSheetData(sheetId);
      
      if (!currentSheetData?.values || !Array.isArray(currentSheetData.values)) {
        throw new Error('Impossible de récupérer les données de la feuille');
      }

      console.log('📊 Données feuille récupérées:', {
        rows: currentSheetData.values.length,
        headers: currentSheetData.values[0]
      });

      let successCount = 0;
      let failedCount = 0;
      const details: { campaign: string; status: 'success' | 'failed'; error?: string }[] = [];
      let workingSheetData = [...currentSheetData.values];

      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        const campaignLabel = `${campaign.campaignName} > ${campaign.adGroupName}`;
        setCurrentCampaign(campaignLabel);
        
        const keywords = campaign.keywords.split(',').map(k => k.trim()).filter(k => k);
        
        if (keywords.length === 0) {
          console.log(`⏭️ Campagne ${i + 1} ignorée - pas de mots-clés`);
          failedCount++;
          details.push({
            campaign: campaignLabel,
            status: 'failed',
            error: 'Aucun mot-clé'
          });
          setGenerationResults({ success: successCount, failed: failedCount, total: campaigns.length, details });
          continue;
        }

        console.log(`🎯 Génération campagne ${i + 1}: ${campaignLabel}`);
        console.log(`🔑 Mots-clés: ${keywords.join(', ')}`);

        try {
          // Utiliser la nouvelle méthode qui génère ET sauvegarde
          const result = await enhancedContentGenerationService.generateAndSaveContent(
            {
              clientContext,
              campaignContext: campaign.campaignName,
              adGroupContext: campaign.adGroupName,
              keywords,
              model: selectedModel
            },
            sheetId,
            i + 1, // +1 pour ignorer les en-têtes
            workingSheetData
          );

          if (result.success && result.updatedSheetData) {
            workingSheetData = result.updatedSheetData;
            successCount++;
            details.push({
              campaign: campaignLabel,
              status: 'success'
            });
            console.log(`✅ Génération et sauvegarde réussies campagne ${i + 1}`);
          } else {
            console.warn(`⚠️ Génération échouée campagne ${i + 1}:`, result.error);
            failedCount++;
            details.push({
              campaign: campaignLabel,
              status: 'failed',
              error: result.error
            });
          }

        } catch (error) {
          console.error(`❌ Erreur génération campagne ${i + 1}:`, error);
          failedCount++;
          details.push({
            campaign: campaignLabel,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          });
        }

        // Mettre à jour le progrès et les résultats
        setProgress((i + 1) / campaigns.length * 100);
        setGenerationResults({ success: successCount, failed: failedCount, total: campaigns.length, details });

        // Petite pause pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setGenerationComplete(true);
      setCurrentCampaign("");
      
      if (successCount > 0) {
        toast.success(`🎉 Génération terminée ! ${successCount} réussie(s), ${failedCount} échouée(s). Consultez votre feuille Google Sheets pour voir les résultats.`);
      } else {
        toast.error(`❌ Aucune génération réussie. ${failedCount} échec(s).`);
      }
      
    } catch (error) {
      console.error("❌ === ERREUR COMPLETE WORKFLOW ===", error);
      toast.error(`Erreur lors de la génération du contenu: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const validationErrors = validatePrerequisites();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Génération de contenu par IA</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Validation des prérequis */}
          {validationErrors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">
                <strong>Prérequis manquants:</strong>
                <ul className="list-disc list-inside mt-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

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

          {/* Configuration des contextes de campagne */}
          {detectedCampaigns.length > 0 && (
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Campagnes détectées:</strong> {detectedCampaigns.length}
                    <br/>
                    <span className="text-sm">
                      {campaignContextsReady ? '✅ Contextes configurés' : '⚠️ Contextes à renseigner'}
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowCampaignContextForm(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {campaignContextsReady ? 'Modifier contextes' : 'Configurer contextes'}
                  </Button>
                </div>
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
              disabled={isGenerating || validationErrors.length > 0}
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

          {/* Résultats détaillés */}
          {generationResults.details.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Détails des résultats :</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {generationResults.details.map((detail, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="truncate">{detail.campaign}</span>
                    <Badge variant={detail.status === 'success' ? 'default' : 'destructive'}>
                      {detail.status === 'success' ? '✅' : '❌'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Succès */}
          {generationComplete && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ✅ Génération terminée ! 
                <br/>
                <strong>Résultats:</strong> {generationResults.success} réussie(s), {generationResults.failed} échouée(s)
                <br/>
                <span className="text-sm text-gray-600">
                  Consultez votre feuille Google Sheets pour voir les titres et descriptions générés.
                </span>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Modal de configuration des contextes de campagne */}
      {showCampaignContextForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl max-h-[80vh] overflow-y-auto w-full mx-4">
            <CampaignContextForm
              campaigns={detectedCampaigns}
              existingContexts={CampaignContextService.loadContexts()}
              onSave={handleCampaignContextsSave}
              onCancel={() => setShowCampaignContextForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentGeneratorWorkflow;
