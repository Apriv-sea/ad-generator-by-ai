import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Play, Copy, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UnifiedPromptService } from '@/services/content/unifiedPromptService';
import { EnhancedContentGenerationService } from '@/services/content/enhancedContentGenerationService';
import { toast } from 'sonner';

interface PromptOptimizerProps {
  onClose?: () => void;
}

const PromptOptimizer: React.FC<PromptOptimizerProps> = ({ onClose }) => {
  const [testParams, setTestParams] = useState({
    clientContext: 'Startup spécialisée dans les solutions de marketing digital pour PME',
    industry: 'services',
    targetPersona: 'dirigeants de PME cherchant à améliorer leur présence en ligne',
    campaignContext: 'Solutions Marketing Digital',
    adGroupContext: 'Stratégie Social Media',
    keywords: ['marketing digital', 'réseaux sociaux', 'stratégie digitale']
  });

  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-20250514');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [lastGenerationTime, setLastGenerationTime] = useState<number>(0);

  const industries = [
    'e-commerce', 'services', 'technologie', 'immobilier', 
    'santé', 'formation', 'général'
  ];

  const models = [
    'claude-sonnet-4-20250514',
    'claude-opus-4-20250514',
    'gpt-4.1-2025-04-14',
    'gpt-4o'
  ];

  const generatePrompt = () => {
    try {
      const prompt = UnifiedPromptService.buildUnifiedPrompt({
        clientContext: testParams.clientContext,
        industry: testParams.industry,
        targetPersona: testParams.targetPersona,
        campaignContext: testParams.campaignContext,
        adGroupContext: testParams.adGroupContext,
        keywords: testParams.keywords,
        model: selectedModel
      });

      setGeneratedPrompt(prompt);
      toast.success('Prompt généré avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la génération du prompt');
      console.error(error);
    }
  };

  const testGeneration = async () => {
    setIsGenerating(true);
    const startTime = Date.now();

    try {
      const result = await EnhancedContentGenerationService.generateContent(
        {
          model: selectedModel,
          clientContext: testParams.clientContext,
          industry: testParams.industry,
          targetPersona: testParams.targetPersona,
          campaignContext: testParams.campaignContext,
          adGroupContext: testParams.adGroupContext,
          keywords: testParams.keywords
        },
        'test-sheet-id',
        []
      );

      const endTime = Date.now();
      setLastGenerationTime(endTime - startTime);
      setGenerationResult(result);
      
      if (result.success) {
        toast.success(`Génération réussie en ${endTime - startTime}ms !`);
      } else {
        toast.error(`Erreur : ${result.error}`);
      }
    } catch (error) {
      toast.error('Erreur lors du test de génération');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    toast.success('Prompt copié dans le presse-papiers !');
  };

  const downloadResults = () => {
    const data = {
      prompt: generatedPrompt,
      parameters: testParams,
      model: selectedModel,
      result: generationResult,
      generationTime: lastGenerationTime,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-test-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🚀 Optimiseur de Prompts Google Ads
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose} className="ml-auto">
                Fermer
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="parameters" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="parameters">Paramètres</TabsTrigger>
              <TabsTrigger value="prompt">Prompt</TabsTrigger>
              <TabsTrigger value="test">Test</TabsTrigger>
              <TabsTrigger value="results">Résultats</TabsTrigger>
            </TabsList>

            {/* Onglet Paramètres */}
            <TabsContent value="parameters" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="industry">Secteur d'activité</Label>
                    <Select
                      value={testParams.industry}
                      onValueChange={(value) => setTestParams(prev => ({ ...prev, industry: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map(industry => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="model">Modèle IA</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map(model => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="campaignContext">Contexte Campagne</Label>
                    <Input
                      value={testParams.campaignContext}
                      onChange={(e) => setTestParams(prev => ({ ...prev, campaignContext: e.target.value }))}
                      placeholder="Ex: Solutions Marketing Digital"
                    />
                  </div>

                  <div>
                    <Label htmlFor="adGroupContext">Contexte Groupe d'Annonces</Label>
                    <Input
                      value={testParams.adGroupContext}
                      onChange={(e) => setTestParams(prev => ({ ...prev, adGroupContext: e.target.value }))}
                      placeholder="Ex: Stratégie Social Media"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="clientContext">Contexte Client</Label>
                    <Textarea
                      value={testParams.clientContext}
                      onChange={(e) => setTestParams(prev => ({ ...prev, clientContext: e.target.value }))}
                      placeholder="Décrivez le client, son activité, ses spécificités..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetPersona">Persona Cible</Label>
                    <Textarea
                      value={testParams.targetPersona}
                      onChange={(e) => setTestParams(prev => ({ ...prev, targetPersona: e.target.value }))}
                      placeholder="Décrivez le public cible..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="keywords">Mots-clés (séparés par des virgules)</Label>
                    <Input
                      value={testParams.keywords.join(', ')}
                      onChange={(e) => setTestParams(prev => ({ 
                        ...prev, 
                        keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                      }))}
                      placeholder="marketing digital, réseaux sociaux, stratégie"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={generatePrompt} className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Générer le Prompt
                </Button>
              </div>
            </TabsContent>

            {/* Onglet Prompt */}
            <TabsContent value="prompt" className="space-y-4">
              {generatedPrompt ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={copyPrompt} className="flex items-center gap-2">
                      <Copy className="h-4 w-4" />
                      Copier
                    </Button>
                    <Badge variant="secondary">
                      {generatedPrompt.length} caractères
                    </Badge>
                  </div>
                  <Textarea
                    value={generatedPrompt}
                    readOnly
                    rows={20}
                    className="font-mono text-sm"
                  />
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Veuillez d'abord générer un prompt dans l'onglet Paramètres
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Onglet Test */}
            <TabsContent value="test" className="space-y-4">
              {generatedPrompt ? (
                <div className="space-y-4">
                  <Button 
                    onClick={testGeneration} 
                    disabled={isGenerating}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    {isGenerating ? 'Test en cours...' : 'Tester la Génération'}
                  </Button>

                  {isGenerating && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Test de génération en cours avec le modèle {selectedModel}...
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Veuillez d'abord générer un prompt pour pouvoir le tester
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Onglet Résultats */}
            <TabsContent value="results" className="space-y-4">
              {generationResult ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {generationResult.success ? (
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Succès
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Échec
                      </Badge>
                    )}
                    {lastGenerationTime > 0 && (
                      <Badge variant="secondary">
                        {lastGenerationTime}ms
                      </Badge>
                    )}
                    <Button variant="outline" onClick={downloadResults} className="flex items-center gap-2 ml-auto">
                      <Download className="h-4 w-4" />
                      Télécharger
                    </Button>
                  </div>

                  {generationResult.success ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Titres Générés ({generationResult.titles?.length || 0})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {generationResult.titles?.map((title: string, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs min-w-[40px]">
                                  {title.length}/30
                                </Badge>
                                <span className="text-sm">{title}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Descriptions Générées ({generationResult.descriptions?.length || 0})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {generationResult.descriptions?.map((desc: string, index: number) => (
                              <div key={index} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {desc.length}/90
                                  </Badge>
                                  <Badge variant={desc.length >= 55 && desc.length <= 90 ? "default" : "destructive"} className="text-xs">
                                    {desc.length >= 55 && desc.length <= 90 ? "✓" : "✗"}
                                  </Badge>
                                </div>
                                <p className="text-sm">{desc}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {generationResult.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Aucun résultat de test disponible. Veuillez d'abord tester la génération.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptOptimizer;