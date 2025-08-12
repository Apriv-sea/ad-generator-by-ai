// Étape 3 : Génération avec preview obligatoire
// L'utilisateur voit AVANT de valider la génération finale

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wand2, Eye, Download, CheckCircle, AlertCircle, 
  Clock, DollarSign, RefreshCw, Edit 
} from "lucide-react";

interface GenerateStepProps {
  data: any;
  onDataUpdate: (updates: any) => void;
  onComplete: (finalProject: any) => void;
}

interface PreviewContent {
  adGroupName: string;
  titles: string[];
  descriptions: string[];
  status: 'pending' | 'generating' | 'completed' | 'error';
}

const GenerateStep: React.FC<GenerateStepProps> = ({ data, onDataUpdate, onComplete }) => {
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<PreviewContent[]>([]);
  const [selectedModel, setSelectedModel] = useState('openai:gpt-4o-mini');
  const [showPreview, setShowPreview] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const models = [
    { id: 'openai:gpt-4o-mini', name: 'GPT-4 Turbo', cost: 0.95, speed: 'Rapide' },
    { id: 'anthropic:claude-3-sonnet', name: 'Claude 3 Sonnet', cost: 1.20, speed: 'Moyen' },
    { id: 'openai:gpt-4', name: 'GPT-4', cost: 1.80, speed: 'Lent' }
  ];

  const selectedModelInfo = models.find(m => m.id === selectedModel);

  const generatePreview = async () => {
    setIsGeneratingPreview(true);
    setShowPreview(true);
    
    try {
      // Simulation de génération pour chaque groupe d'annonces
      const adGroups = [
        'Running Homme',
        'Running Femme', 
        'Robes Été',
        'Shorts Homme'
      ];
      
      const previews: PreviewContent[] = adGroups.map(name => ({
        adGroupName: name,
        titles: [],
        descriptions: [],
        status: 'pending' as const
      }));
      
      setPreviewContent(previews);
      
      // Simuler génération progressive
      for (let i = 0; i < adGroups.length; i++) {
        // Marquer comme en cours
        setPreviewContent(prev => prev.map((item, index) => 
          index === i ? { ...item, status: 'generating' } : item
        ));
        
        // Simuler délai de génération
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simuler contenu généré
        const mockTitles = Array.from({ length: 15 }, (_, idx) => 
          `Titre ${idx + 1} pour ${adGroups[i]}`
        );
        const mockDescriptions = Array.from({ length: 4 }, (_, idx) => 
          `Description ${idx + 1} pour ${adGroups[i]} avec appel à l'action`
        );
        
        // Marquer comme terminé
        setPreviewContent(prev => prev.map((item, index) => 
          index === i ? { 
            ...item, 
            titles: mockTitles,
            descriptions: mockDescriptions,
            status: 'completed'
          } : item
        ));
      }
      
    } catch (error) {
      console.error('Erreur génération preview:', error);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const regenerateAdGroup = async (adGroupIndex: number) => {
    setPreviewContent(prev => prev.map((item, index) => 
      index === adGroupIndex ? { ...item, status: 'generating' } : item
    ));
    
    // Simuler regénération
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockTitles = Array.from({ length: 15 }, (_, idx) => 
      `Nouveau Titre ${idx + 1} pour ${previewContent[adGroupIndex].adGroupName}`
    );
    const mockDescriptions = Array.from({ length: 4 }, (_, idx) => 
      `Nouvelle Description ${idx + 1} avec CTA amélioré`
    );
    
    setPreviewContent(prev => prev.map((item, index) => 
      index === adGroupIndex ? { 
        ...item, 
        titles: mockTitles,
        descriptions: mockDescriptions,
        status: 'completed'
      } : item
    ));
  };

  const finalizeProject = async () => {
    setIsFinalizing(true);
    
    try {
      // Simuler sauvegarde finale
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const finalProject = {
        id: `project_${Date.now()}`,
        name: data.projectName,
        client: data.selectedClient.name,
        status: 'completed',
        content: previewContent,
        generatedAt: new Date().toISOString()
      };
      
      onComplete(finalProject);
      
    } catch (error) {
      console.error('Erreur finalisation:', error);
    } finally {
      setIsFinalizing(false);
    }
  };

  const renderModelSelection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sélection du modèle IA</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {models.map((model) => (
            <Card 
              key={model.id}
              className={`cursor-pointer transition-all ${
                selectedModel === model.id 
                  ? 'ring-2 ring-purple-500 bg-purple-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedModel(model.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{model.name}</h4>
                  {selectedModel === model.id && (
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  )}
                </div>
                
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Coût/groupe:</span>
                    <span className="font-medium">{model.cost}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vitesse:</span>
                    <span className="font-medium">{model.speed}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {selectedModelInfo && (
          <Alert className="mt-4">
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              Coût total estimé: <strong>
                {(selectedModelInfo.cost * (data.sheetData?.length - 1 || 4)).toFixed(2)}€
              </strong> pour {data.sheetData?.length - 1 || 4} groupes d'annonces
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderPreviewResults = () => {
    if (!showPreview) return null;
    
    return (
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Aperçu du contenu généré</span>
            </CardTitle>
            
            <div className="flex space-x-2">
              <Badge variant="outline">
                {previewContent.filter(p => p.status === 'completed').length}/{previewContent.length} terminés
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="0" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {previewContent.map((content, index) => (
                <TabsTrigger key={index} value={index.toString()}>
                  {content.adGroupName}
                  {content.status === 'generating' && (
                    <RefreshCw className="w-3 h-3 ml-1 animate-spin" />
                  )}
                  {content.status === 'completed' && (
                    <CheckCircle className="w-3 h-3 ml-1 text-green-600" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {previewContent.map((content, index) => (
              <TabsContent key={index} value={index.toString()} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{content.adGroupName}</h3>
                  
                  {content.status === 'completed' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => regenerateAdGroup(index)}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regénérer
                    </Button>
                  )}
                </div>
                
                {content.status === 'generating' && (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                    <p className="text-muted-foreground">Génération en cours...</p>
                  </div>
                )}
                
                {content.status === 'completed' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Titres */}
                    <div>
                      <h4 className="font-medium mb-3">Titres (15)</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {content.titles.map((title, idx) => (
                          <div key={idx} className="p-2 border rounded text-sm">
                            {title}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Descriptions */}
                    <div>
                      <h4 className="font-medium mb-3">Descriptions (4)</h4>
                      <div className="space-y-2">
                        {content.descriptions.map((desc, idx) => (
                          <div key={idx} className="p-3 border rounded text-sm">
                            {desc}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  const allCompleted = previewContent.length > 0 && 
    previewContent.every(p => p.status === 'completed');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wand2 className="w-5 h-5 text-purple-600" />
            <span>Génération de Contenu IA</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Résumé du projet */}
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <strong>Projet:</strong> {data.projectName}
                </div>
                <div>
                  <strong>Client:</strong> {data.selectedClient?.name}
                </div>
                <div>
                  <strong>Groupes:</strong> {data.sheetData?.length - 1 || 4}
                </div>
                <div>
                  <strong>Contenu:</strong> {(data.sheetData?.length - 1 || 4) * 19} éléments
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Actions principales */}
          <div className="flex space-x-4">
            <Button 
              onClick={generatePreview}
              disabled={isGeneratingPreview || showPreview}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isGeneratingPreview ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Générer un aperçu
                </>
              )}
            </Button>
            
            {allCompleted && (
              <Button 
                onClick={finalizeProject}
                disabled={isFinalizing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isFinalizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Finalisation...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Finaliser le projet
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sélection du modèle */}
      {renderModelSelection()}
      
      {/* Aperçu des résultats */}
      {renderPreviewResults()}
    </div>
  );
};

export default GenerateStep;