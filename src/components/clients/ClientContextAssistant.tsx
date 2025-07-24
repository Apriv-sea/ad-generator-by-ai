import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Globe, Search, Brain, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ClientContextAnalysisService } from '@/services/clientContextAnalysisService';

interface AnalysisStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  icon: React.ComponentType<any>;
}

interface ClientContextAssistantProps {
  onContextGenerated: (context: any) => void;
  initialData?: any;
}

export const ClientContextAssistant: React.FC<ClientContextAssistantProps> = ({
  onContextGenerated,
  initialData
}) => {
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.website || '');
  const [businessName, setBusinessName] = useState(initialData?.name || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<string>('');

  const analysisSteps: AnalysisStep[] = [
    {
      id: 'website-analysis',
      title: 'Analyse du site web',
      description: 'Extraction du contenu et analyse de la stratégie digitale',
      status: 'pending',
      icon: Globe
    },
    {
      id: 'market-research',
      title: 'Recherche sectorielle',
      description: 'Analyse concurrentielle et tendances du marché',
      status: 'pending',
      icon: Search
    },
    {
      id: 'context-generation',
      title: 'Génération du contexte',
      description: 'Création automatique du contexte client personnalisé',
      status: 'pending',
      icon: Brain
    }
  ];

  const [steps, setSteps] = useState(analysisSteps);

  const updateStepStatus = (stepId: string, status: AnalysisStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
    setCurrentStep(stepId);
  };

  const handleAnalysis = async () => {
    if (!websiteUrl || !businessName) {
      toast.error('Veuillez renseigner le nom de l\'entreprise et son site web');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setAnalysisResult(null);

    try {
      // Étape 1: Analyse du site web
      updateStepStatus('website-analysis', 'running');
      setProgress(20);
      
      const websiteAnalysis = await ClientContextAnalysisService.analyzeWebsite(websiteUrl);
      
      updateStepStatus('website-analysis', 'completed');
      setProgress(40);

      // Étape 2: Recherche sectorielle
      updateStepStatus('market-research', 'running');
      setProgress(60);
      
      const marketResearch = await ClientContextAnalysisService.conductMarketResearch(
        businessName, 
        websiteAnalysis.industry || 'business'
      );
      
      updateStepStatus('market-research', 'completed');
      setProgress(80);

      // Étape 3: Génération du contexte
      updateStepStatus('context-generation', 'running');
      setProgress(90);
      
      const generatedContext = await ClientContextAnalysisService.generateClientContext({
        businessName,
        websiteUrl,
        websiteAnalysis,
        marketResearch
      });
      
      updateStepStatus('context-generation', 'completed');
      setProgress(100);

      setAnalysisResult(generatedContext);
      toast.success('Analyse terminée avec succès !');

    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      
      // Marquer l'étape courante comme erreur
      if (currentStep) {
        updateStepStatus(currentStep, 'error');
      }
      
      toast.error('Erreur lors de l\'analyse: ' + (error as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUseContext = () => {
    if (analysisResult) {
      onContextGenerated(analysisResult);
      toast.success('Contexte appliqué au client !');
    }
  };

  const getStepIcon = (step: AnalysisStep) => {
    const IconComponent = step.icon;
    
    if (step.status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (step.status === 'running') {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    } else if (step.status === 'error') {
      return <IconComponent className="h-5 w-5 text-red-500" />;
    } else {
      return <IconComponent className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Assistant de Contexte Client IA
        </CardTitle>
        <CardDescription>
          Analysez automatiquement un client pour générer un contexte riche et pertinent
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Formulaire d'entrée */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="business-name">Nom de l'entreprise</Label>
            <Input
              id="business-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ex: Nike, Coca-Cola..."
              disabled={isAnalyzing}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website-url">Site web</Label>
            <Input
              id="website-url"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://www.example.com"
              disabled={isAnalyzing}
            />
          </div>
        </div>

        {/* Bouton d'analyse */}
        <Button 
          onClick={handleAnalysis} 
          disabled={isAnalyzing || !websiteUrl || !businessName}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            'Lancer l\'analyse IA'
          )}
        </Button>

        {/* Barre de progression */}
        {isAnalyzing && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              {progress}% - {steps.find(s => s.status === 'running')?.title || 'Analyse en cours...'}
            </p>
          </div>
        )}

        {/* Étapes d'analyse */}
        {(isAnalyzing || analysisResult) && (
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg border">
                {getStepIcon(step)}
                <div className="flex-1">
                  <h4 className="font-medium">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                <Badge variant={
                  step.status === 'completed' ? 'default' :
                  step.status === 'running' ? 'secondary' :
                  step.status === 'error' ? 'destructive' : 'outline'
                }>
                  {step.status === 'pending' ? 'En attente' :
                   step.status === 'running' ? 'En cours' :
                   step.status === 'completed' ? 'Terminé' : 'Erreur'}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Résultats de l'analyse */}
        {analysisResult && (
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Résumé</TabsTrigger>
              <TabsTrigger value="website">Site Web</TabsTrigger>
              <TabsTrigger value="market">Marché</TabsTrigger>
              <TabsTrigger value="context">Contexte</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="space-y-4">
              <Alert>
                <AlertDescription>
                  Analyse terminée ! Vous pouvez maintenant appliquer ce contexte à votre client.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Secteur d'activité</h4>
                  <Badge variant="outline">{analysisResult.industry}</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Tone of Voice</h4>
                  <Badge variant="outline">{analysisResult.toneOfVoice}</Badge>
                </div>
              </div>
              
              <Button onClick={handleUseContext} className="w-full">
                Appliquer ce contexte au client
              </Button>
            </TabsContent>
            
            <TabsContent value="website" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Messages clés détectés</h4>
                  <Textarea 
                    value={analysisResult.keyMessages?.join('\n') || ''} 
                    readOnly 
                    rows={4}
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Style de communication</h4>
                  <p className="text-sm text-muted-foreground">{analysisResult.communicationStyle}</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="market" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Analyse concurrentielle</h4>
                  <Textarea 
                    value={analysisResult.competitiveAnalysis || ''} 
                    readOnly 
                    rows={4}
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Tendances du secteur</h4>
                  <Textarea 
                    value={analysisResult.marketTrends || ''} 
                    readOnly 
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="context" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Contexte Business généré</h4>
                  <Textarea 
                    value={analysisResult.businessContext || ''} 
                    readOnly 
                    rows={6}
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Guidelines éditoriales</h4>
                  <Textarea 
                    value={analysisResult.editorialGuidelines || ''} 
                    readOnly 
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};