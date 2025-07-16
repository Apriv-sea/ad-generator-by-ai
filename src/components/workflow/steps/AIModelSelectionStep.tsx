
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Zap, Brain } from 'lucide-react';

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
  const [selectedModel, setSelectedModel] = useState(data?.selectedModel || 'claude-sonnet-4-20250514');
  const [customPrompt, setCustomPrompt] = useState(data?.customPrompt || '');

  const models = [
    {
      id: 'claude-sonnet-4-20250514',
      name: 'Claude 4 Sonnet',
      description: 'Modèle le plus récent et performant de Claude 4, recommandé',
      icon: Brain,
      recommended: true
    },
    {
      id: 'openai:gpt-4',
      name: 'GPT-4',
      description: 'Plus précis et créatif, recommandé pour du contenu complexe',
      icon: Brain,
      premium: true
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      description: 'Modèle rapide et efficace pour la génération de contenu publicitaire',
      icon: Zap
    }
  ];

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
      modelConfig: models.find(m => m.id === selectedModel)
    });
  };

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
          <CardTitle>Modèles disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedModel} onValueChange={setSelectedModel}>
            {models.map((model) => {
              const IconComponent = model.icon;
              return (
                <div key={model.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value={model.id} id={model.id} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={model.id} className="flex items-center cursor-pointer">
                      <IconComponent className="w-4 h-4 mr-2" />
                      {model.name}
                      {model.recommended && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          Recommandé
                        </span>
                      )}
                      {model.premium && (
                        <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          Premium
                        </span>
                      )}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
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
