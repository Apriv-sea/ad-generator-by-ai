import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { IndustryAnalysisService, INDUSTRIES, type IndustryAnalysisResult } from '@/services/ai/industryAnalysisService';
import { UnifiedPromptService } from '@/services/content/unifiedPromptService';
import { toast } from 'sonner';

interface IndustrySelectorProps {
  selectedIndustry?: string;
  onIndustryChange: (industry: string) => void;
  businessContext?: string;
  clientName?: string;
  showPromptPreview?: boolean;
  required?: boolean;
}

const IndustrySelector: React.FC<IndustrySelectorProps> = ({
  selectedIndustry,
  onIndustryChange,
  businessContext = '',
  clientName = '',
  showPromptPreview = true,
  required = true
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<IndustryAnalysisResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [promptPreview, setPromptPreview] = useState('');

  // Analyser automatiquement quand le contexte change
  useEffect(() => {
    if (businessContext.length > 20) {
      handleAutoAnalysis();
    }
  }, [businessContext]);

  // Générer la prévisualisation du prompt quand le secteur change
  useEffect(() => {
    if (selectedIndustry && showPromptPreview) {
      generatePromptPreview();
    }
  }, [selectedIndustry, showPromptPreview]);

  const handleAutoAnalysis = async () => {
    if (!businessContext || businessContext.length < 20) {
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await IndustryAnalysisService.analyzeIndustry(
        businessContext,
        clientName
      );
      
      setAnalysisResult(result);
      
      if (result.confidence > 70) {
        toast.success(`Secteur "${INDUSTRIES.find(i => i.key === result.suggestedIndustry)?.label}" suggéré avec ${result.confidence}% de confiance`);
      }
    } catch (error) {
      console.error('Erreur analyse secteur:', error);
      toast.error('Erreur lors de l\'analyse automatique du secteur');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (analysisResult) {
      onIndustryChange(analysisResult.suggestedIndustry);
      toast.success('Secteur suggéré appliqué !');
    }
  };

  const generatePromptPreview = () => {
    if (!selectedIndustry) {
      setPromptPreview('');
      return;
    }

    try {
      // Créer un exemple de prompt avec le secteur sélectionné
      const samplePrompt = UnifiedPromptService.buildUnifiedPrompt({
        clientContext: businessContext || 'Exemple d\'entreprise dans ce secteur',
        industry: selectedIndustry,
        targetPersona: 'clients potentiels',
        campaignContext: 'Campagne exemple',
        adGroupContext: 'Groupe exemple',
        keywords: ['mot-clé', 'exemple'],
        model: 'claude-sonnet-4-20250514'
      });

      setPromptPreview(samplePrompt);
    } catch (error) {
      console.error('Erreur génération preview:', error);
    }
  };

  const getIndustryIcon = (industryKey: string) => {
    const icons: { [key: string]: string } = {
      'e-commerce': '🛒',
      'services-professionnels': '🔧',
      'technologie': '💻',
      'immobilier': '🏡',
      'sante-bien-etre': '⚕️',
      'formation-education': '🎓',
      'finance-assurance': '💰',
      'tourisme-loisirs': '✈️',
      'automobile': '🚗',
      'restaurant-alimentation': '🍽️',
      'mode-beaute': '👗',
      'construction-renovation': '🔨',
      'sport-fitness': '💪',
      'juridique': '⚖️',
      'autre': '📋'
    };
    return icons[industryKey] || '📋';
  };

  const selectedIndustryDetails = selectedIndustry 
    ? INDUSTRIES.find(ind => ind.key === selectedIndustry)
    : null;

  return (
    <div className="space-y-4">
      {/* Section principale de sélection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            🎯 Secteur d'activité
            {required && <Badge variant="destructive" className="text-xs">Obligatoire</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Analyse automatique */}
          {businessContext.length > 20 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoAnalysis}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isAnalyzing ? 'Analyse en cours...' : 'Analyser avec IA'}
                </Button>
                
                {showPromptPreview && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2"
                  >
                    {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showPreview ? 'Masquer' : 'Voir impact'} prompt
                  </Button>
                )}
              </div>

              {/* Résultat de l'analyse */}
              {analysisResult && (
                <Alert className={analysisResult.confidence > 70 ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
                  <div className="flex items-start gap-3">
                    {analysisResult.confidence > 70 ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          Secteur suggéré : {INDUSTRIES.find(i => i.key === analysisResult.suggestedIndustry)?.label}
                        </span>
                        <Badge variant={analysisResult.confidence > 70 ? "default" : "secondary"}>
                          {analysisResult.confidence}% confiance
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {analysisResult.reasoning}
                      </p>
                      {analysisResult.suggestedIndustry !== selectedIndustry && (
                        <Button
                          size="sm"
                          onClick={handleAcceptSuggestion}
                          className="mt-2"
                        >
                          Appliquer cette suggestion
                        </Button>
                      )}
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          )}

          {/* Sélecteur de secteur */}
          <div className="space-y-2">
            <Select value={selectedIndustry} onValueChange={onIndustryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le secteur d'activité principal" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map(industry => (
                  <SelectItem key={industry.key} value={industry.key}>
                    <div className="flex items-center gap-2">
                      <span>{getIndustryIcon(industry.key)}</span>
                      <span>{industry.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedIndustryDetails && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  {selectedIndustryDetails.description}
                </p>
                {selectedIndustryDetails.examples.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium">Exemples : </span>
                    <span className="text-xs text-muted-foreground">
                      {selectedIndustryDetails.examples.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Prévisualisation de l'impact sur le prompt */}
      {showPreview && selectedIndustry && promptPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              👁️ Impact du secteur sur le prompt de génération
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="section" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="section">Section spécialisée</TabsTrigger>
                <TabsTrigger value="full">Prompt complet</TabsTrigger>
              </TabsList>
              
              <TabsContent value="section" className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Voici comment le secteur "{selectedIndustryDetails?.label}" influence les stratégies de génération :
                  </AlertDescription>
                </Alert>
                
                <div className="bg-muted p-4 rounded-md">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {promptPreview.split('═══════════════════════════════════════════════════════════════')[2]?.split('═══════════════════════════════════════════════════════════════')[0] || 'Section non trouvée'}
                  </pre>
                </div>
              </TabsContent>
              
              <TabsContent value="full" className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Prompt complet généré avec le secteur sélectionné (aperçu pour transparence) :
                  </AlertDescription>
                </Alert>
                
                <Textarea
                  value={promptPreview}
                  readOnly
                  rows={15}
                  className="font-mono text-xs"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IndustrySelector;