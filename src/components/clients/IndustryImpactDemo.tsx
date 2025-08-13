import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, Sparkles, TestTube2, Download } from 'lucide-react';
import IndustrySelector from './IndustrySelector';
import { UnifiedPromptService } from '@/services/content/unifiedPromptService';
import { EnhancedContentGenerationService } from '@/services/content/enhancedContentGenerationService';
import { toast } from 'sonner';

interface IndustryImpactDemoProps {
  onClose?: () => void;
}

const IndustryImpactDemo: React.FC<IndustryImpactDemoProps> = ({ onClose }) => {
  const [demoData, setDemoData] = useState({
    clientName: 'Café des Artistes',
    businessContext: 'Restaurant traditionnel français au cœur de Lyon, spécialisé dans la cuisine du terroir avec des produits locaux. Ambiance chaleureuse et familiale.',
    industry: '',
    targetPersona: 'Familles lyonnaises et touristes gastronomes',
    campaign: 'Menu du Chef',
    adGroup: 'Spécialités Lyonnaises',
    keywords: ['restaurant lyon', 'cuisine traditionnelle', 'menu terroir']
  });

  const [comparisons, setComparisons] = useState<{ [industry: string]: any }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedComparison, setSelectedComparison] = useState<string>('');

  const sectorsToCompare = [
    'restaurant-alimentation',
    'services-professionnels', 
    'e-commerce',
    'technologie'
  ];

  const generateComparisons = async () => {
    setIsGenerating(true);
    const newComparisons: { [industry: string]: any } = {};

    try {
      // Générer les prompts pour chaque secteur
      for (const industry of sectorsToCompare) {
        const prompt = UnifiedPromptService.buildUnifiedPrompt({
          clientContext: demoData.businessContext,
          industry,
          targetPersona: demoData.targetPersona,
          campaignContext: demoData.campaign,
          adGroupContext: demoData.adGroup,
          keywords: demoData.keywords,
          model: 'claude-sonnet-4-20250514'
        });

        // Tester la génération
        const result = await EnhancedContentGenerationService.generateContent(
          {
            model: 'claude-sonnet-4-20250514',
            clientContext: demoData.businessContext,
            industry,
            targetPersona: demoData.targetPersona,
            campaignContext: demoData.campaign,
            adGroupContext: demoData.adGroup,
            keywords: demoData.keywords
          },
          'demo-sheet',
          []
        );

        newComparisons[industry] = {
          prompt,
          result,
          industryName: industry.replace('-', ' ').toUpperCase()
        };
      }

      setComparisons(newComparisons);
      toast.success('Comparaisons générées avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la génération des comparaisons');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadComparison = () => {
    const data = {
      demoData,
      comparisons,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `industry-impact-demo-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎭 Démonstration : Impact du Secteur sur la Génération
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose} className="ml-auto">
                Fermer
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              Cette démo montre comment le choix du secteur influence dramatically la génération de contenu publicitaire.
              Modifiez les paramètres et voyez l'impact en temps réel !
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="config" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="selector">Sélecteur</TabsTrigger>
              <TabsTrigger value="comparison">Comparaison</TabsTrigger>
              <TabsTrigger value="results">Résultats</TabsTrigger>
            </TabsList>

            {/* Configuration de base */}
            <TabsContent value="config" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label>Nom du client</Label>
                    <Input
                      value={demoData.clientName}
                      onChange={(e) => setDemoData(prev => ({ ...prev, clientName: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Public cible</Label>
                    <Input
                      value={demoData.targetPersona}
                      onChange={(e) => setDemoData(prev => ({ ...prev, targetPersona: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Campagne</Label>
                    <Input
                      value={demoData.campaign}
                      onChange={(e) => setDemoData(prev => ({ ...prev, campaign: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Groupe d'annonces</Label>
                    <Input
                      value={demoData.adGroup}
                      onChange={(e) => setDemoData(prev => ({ ...prev, adGroup: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Contexte business</Label>
                    <Textarea
                      value={demoData.businessContext}
                      onChange={(e) => setDemoData(prev => ({ ...prev, businessContext: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label>Mots-clés (séparés par des virgules)</Label>
                    <Input
                      value={demoData.keywords.join(', ')}
                      onChange={(e) => setDemoData(prev => ({ 
                        ...prev, 
                        keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                      }))}
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={generateComparisons}
                disabled={isGenerating || !demoData.businessContext}
                className="w-full flex items-center gap-2"
              >
                {isGenerating ? (
                  <>Génération en cours...</>
                ) : (
                  <>
                    <TestTube2 className="h-4 w-4" />
                    Générer la Comparaison Multi-Secteurs
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Test du sélecteur */}
            <TabsContent value="selector" className="space-y-4">
              <IndustrySelector
                selectedIndustry={demoData.industry}
                onIndustryChange={(industry) => setDemoData(prev => ({ ...prev, industry }))}
                businessContext={demoData.businessContext}
                clientName={demoData.clientName}
                showPromptPreview={true}
                required={false}
              />
            </TabsContent>

            {/* Comparaison des secteurs */}
            <TabsContent value="comparison" className="space-y-4">
              {Object.keys(comparisons).length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="default">
                      {Object.keys(comparisons).length} secteurs comparés
                    </Badge>
                    <Button variant="outline" size="sm" onClick={downloadComparison}>
                      <Download className="h-4 w-4 mr-1" />
                      Télécharger
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {Object.entries(comparisons).map(([industry, data]) => (
                      <Card key={industry} className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedComparison(industry)}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {data.industryName}
                            {selectedComparison === industry && (
                              <Badge variant="default" className="ml-2">Sélectionné</Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {data.result?.success ? (
                            <div className="space-y-2">
                              <div>
                                <span className="text-sm font-medium">Exemple de titre :</span>
                                <p className="text-sm text-muted-foreground">
                                  "{data.result.titles?.[0] || 'N/A'}"
                                </p>
                              </div>
                              <div>
                                <span className="text-sm font-medium">Exemple de description :</span>
                                <p className="text-sm text-muted-foreground">
                                  "{data.result.descriptions?.[0] || 'N/A'}"
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {data.result.titles?.length || 0} titres, {data.result.descriptions?.length || 0} descriptions
                              </Badge>
                            </div>
                          ) : (
                            <p className="text-sm text-red-500">
                              Erreur : {data.result?.error || 'Génération échouée'}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {selectedComparison && comparisons[selectedComparison] && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Détails : {comparisons[selectedComparison].industryName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue="prompt-section">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="prompt-section">Section Spécialisée</TabsTrigger>
                            <TabsTrigger value="full-content">Contenu Généré</TabsTrigger>
                            <TabsTrigger value="full-prompt">Prompt Complet</TabsTrigger>
                          </TabsList>

                          <TabsContent value="prompt-section" className="mt-4">
                            <div className="bg-muted p-4 rounded-md">
                              <pre className="text-sm whitespace-pre-wrap">
                                {comparisons[selectedComparison].prompt
                                  .split('═══════════════════════════════════════════════════════════════')[2]
                                  ?.split('═══════════════════════════════════════════════════════════════')[0] || 'Section non trouvée'}
                              </pre>
                            </div>
                          </TabsContent>

                          <TabsContent value="full-content" className="mt-4">
                            {comparisons[selectedComparison].result?.success ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Titres générés :</h4>
                                  <div className="space-y-1">
                                    {comparisons[selectedComparison].result.titles?.map((title: string, i: number) => (
                                      <div key={i} className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs w-12">
                                          {title.length}/30
                                        </Badge>
                                        <span className="text-sm">{title}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Descriptions générées :</h4>
                                  <div className="space-y-2">
                                    {comparisons[selectedComparison].result.descriptions?.map((desc: string, i: number) => (
                                      <div key={i} className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs">
                                            {desc.length}/90
                                          </Badge>
                                        </div>
                                        <p className="text-sm">{desc}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <Alert variant="destructive">
                                <AlertDescription>
                                  Erreur : {comparisons[selectedComparison].result?.error}
                                </AlertDescription>
                              </Alert>
                            )}
                          </TabsContent>

                          <TabsContent value="full-prompt" className="mt-4">
                            <Textarea
                              value={comparisons[selectedComparison].prompt}
                              readOnly
                              rows={20}
                              className="font-mono text-xs"
                            />
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    Utilisez l'onglet Configuration pour générer des comparaisons entre secteurs.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Résultats synthétisés */}
            <TabsContent value="results" className="space-y-4">
              {Object.keys(comparisons).length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Analyse comparative des secteurs</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(comparisons).map(([industry, data]) => (
                      <Card key={industry}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{data.industryName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {data.result?.success ? (
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-xs text-muted-foreground">Titres :</span>
                                <Badge variant="outline" className="text-xs">
                                  {data.result.titles?.length || 0}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-muted-foreground">Descriptions :</span>
                                <Badge variant="outline" className="text-xs">
                                  {data.result.descriptions?.length || 0}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-xs text-muted-foreground">Temps :</span>
                                <Badge variant="secondary" className="text-xs">
                                  {data.result.tokensUsed || 0} tokens
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              Échec
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Observation :</strong> Chaque secteur génère des contenus avec des tonalités, 
                      mots-clés et approches complètement différentes, même avec un contexte client identique. 
                      C'est la preuve de l'efficacité du système d'adaptation sectorielle !
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Aucun résultat à afficher. Générez d'abord des comparaisons dans l'onglet Configuration.
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

export default IndustryImpactDemo;