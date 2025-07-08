/**
 * Workflow pour la génération de contenu IA
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Wand2, CheckCircle, AlertCircle, Save, RefreshCw } from "lucide-react";
import { Campaign, Client } from "@/services/types";
import { enhancedContentGenerationService } from "@/services/content/enhancedContentGenerationService";
import { googleSheetsService } from "@/services/googlesheets/googleSheetsService";
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
  const [generationResults, setGenerationResults] = useState<{
    success: number;
    failed: number;
    total: number;
  }>({ success: 0, failed: 0, total: 0 });

  // Validation des prérequis
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

      let successCount = 0;
      let failedCount = 0;

      console.log(`🚀 === DEBUT GENERATION WORKFLOW ===`);
      console.log(`📋 Feuille ID: ${sheetId}`);
      console.log(`🎯 Modèle sélectionné: ${selectedModel}`);
      console.log(`📊 Campagnes à traiter: ${campaigns.length}`);

      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        setCurrentCampaign(`${campaign.campaignName} > ${campaign.adGroupName}`);
        
        const keywords = campaign.keywords.split(',').map(k => k.trim()).filter(k => k);
        
        if (keywords.length === 0) {
          console.log(`⏭️ Campagne ${i + 1} ignorée - pas de mots-clés`);
          failedCount++;
          setGenerationResults({ success: successCount, failed: failedCount, total: campaigns.length });
          continue;
        }

        console.log(`🎯 Génération campagne ${i + 1}: ${campaign.campaignName} > ${campaign.adGroupName}`);
        console.log(`🔑 Mots-clés: ${keywords.join(', ')}`);

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
            [],
            {
              validateContent: true,
              saveToHistory: true,
              createBackup: i === 0,
              autoCleanContent: true,
              maxRegenerateAttempts: 1
            }
          );

          if (result.success && result.titles && result.descriptions) {
            successCount++;
            console.log(`✅ Génération réussie campagne ${i + 1}`);
          } else {
            console.warn(`⚠️ Génération échouée campagne ${i + 1}:`, result);
            failedCount++;
          }

        } catch (error) {
          console.error(`❌ Erreur génération campagne ${i + 1}:`, error);
          failedCount++;
        }

        // Mettre à jour le progrès et les résultats
        setProgress((i + 1) / campaigns.length * 100);
        setGenerationResults({ success: successCount, failed: failedCount, total: campaigns.length });
      }
      
      setGenerationComplete(true);
      setCurrentCampaign("");
      
      toast.success(`🎉 Génération terminée ! ${successCount} réussie(s), ${failedCount} échouée(s)`);
      
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