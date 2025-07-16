
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Zap, Brain, Loader2 } from 'lucide-react';
import { modelDiscoveryService, type ModelInfo, type ProviderModels } from '@/services/llm/modelDiscoveryService';

interface AIModelSelectionStepProps {
  data?: any;
  onComplete: (data: any) => void;
  previousData: Record<string, any>;
}

const AIModelSelectionStep: React.FC<AIModelSelectionStepProps> = ({
  data,
  onComplete,
  previousData
}) => {
  const [selectedModel, setSelectedModel] = useState(data?.selectedModel || '');
  const [customPrompt, setCustomPrompt] = useState(data?.customPrompt || '');
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAvailableModels = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const providers: ('openai' | 'anthropic' | 'google')[] = ['anthropic', 'openai', 'google'];
        const allModels: ModelInfo[] = [];
        
        for (const provider of providers) {
          try {
            const providerModels = await modelDiscoveryService.discoverAvailableModels(provider);
            if (providerModels.models && providerModels.models.length > 0) {
              // Ajouter le prefix du provider pour chaque modèle
              const modelsWithProvider = providerModels.models.map(model => ({
                ...model,
                id: provider === 'anthropic' ? model.id : `${provider}:${model.id}`,
                provider
              }));
              allModels.push(...modelsWithProvider);
            }
          } catch (providerError) {
            console.warn(`Erreur lors de la récupération des modèles ${provider}:`, providerError);
          }
        }
        
        setAvailableModels(allModels);
        
        // Sélectionner automatiquement le premier modèle si aucun n'est sélectionné
        if (!selectedModel && allModels.length > 0) {
          setSelectedModel(allModels[0].id);
        }
        
      } catch (err) {
        console.error('Erreur lors du chargement des modèles:', err);
        setError('Impossible de charger les modèles disponibles. Vérifiez vos clés API.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailableModels();
  }, [selectedModel]);

  const defaultPrompt = `Vous êtes un rédacteur publicitaire hautement qualifié avec une solide expérience en rédaction persuasive, en optimisation des conversions et en techniques de marketing. Vous rédigez des textes convaincants qui touchent les émotions et les besoins du public cible, les incitant à agir ou à acheter. Vous comprenez l'importance de la méthode AIDA (Attention, Intérêt, Désir et Action) et d'autres formules de rédaction éprouvées, que vous intégrez parfaitement dans vos écrits. Vous avez un talent pour créer des titres accrocheurs, des introductions captivantes et des appels à l'action persuasifs. Vous maîtrisez bien la psychologie des consommateurs et utilisez ces connaissances pour créer des messages qui résonnent avec le public cible.

En tant qu'expert en marketing digital, générez du contenu publicitaire optimisé pour les campagnes Google Ads.

Données de campagne disponibles :
- Nom de la campagne : {campaign_name}
- Groupe d'annonces : {ad_group_name}
- Mots-clés : {keywords}

Instructions :
1. Créez des titres accrocheurs (max 30 caractères)
2. Rédigez des descriptions persuasives (max 90 caractères)
3. Utilisez les mots-clés de manière naturelle
4. Adaptez le ton à la cible

Format de sortie : JSON avec titres et descriptions numérotés.`;

  const handleContinue = () => {
    onComplete({
      selectedModel,
      customPrompt: customPrompt || defaultPrompt,
      modelConfig: availableModels.find(m => m.id === selectedModel)
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Chargement des modèles disponibles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Sélection du modèle IA</h3>
        <p className="text-sm text-gray-600">
          Choisissez le modèle d'intelligence artificielle pour générer votre contenu
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modèles disponibles ({availableModels.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {availableModels.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Aucun modèle disponible. Vérifiez vos clés API dans les paramètres.
            </p>
          ) : (
            <RadioGroup value={selectedModel} onValueChange={setSelectedModel}>
              {availableModels.map((model) => (
                <div key={model.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value={model.id} id={model.id} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={model.id} className="flex items-center cursor-pointer">
                      <Brain className="w-4 h-4 mr-2" />
                      {model.name}
                      <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {(model as any).provider}
                      </span>
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                    {model.contextWindow && (
                      <p className="text-xs text-gray-500">
                        Contexte: {model.contextWindow.toLocaleString()} tokens
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prompt personnalisé (optionnel)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={defaultPrompt}
            rows={8}
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            Laissez vide pour utiliser le prompt par défaut optimisé pour Google Ads
          </p>
        </CardContent>
      </Card>

      <Button onClick={handleContinue} className="w-full" disabled={!selectedModel}>
        Continuer vers la configuration des résultats
      </Button>
    </div>
  );
};

export default AIModelSelectionStep;
