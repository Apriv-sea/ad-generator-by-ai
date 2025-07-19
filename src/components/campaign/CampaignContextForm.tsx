import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CampaignContextFormProps {
  campaigns: string[];
  existingContexts?: Record<string, string>;
  onSave: (contexts: Record<string, string>) => void;
  onCancel: () => void;
}

export const CampaignContextForm: React.FC<CampaignContextFormProps> = ({
  campaigns,
  existingContexts = {},
  onSave,
  onCancel
}) => {
  const [contexts, setContexts] = useState<Record<string, string>>(existingContexts);

  const handleContextChange = (campaign: string, context: string) => {
    setContexts(prev => ({
      ...prev,
      [campaign]: context
    }));
  };

  const handleSave = () => {
    // Vérifier que tous les contextes sont renseignés
    const missingContexts = campaigns.filter(campaign => !contexts[campaign]?.trim());
    
    if (missingContexts.length > 0) {
      toast.error(`Veuillez renseigner le contexte pour : ${missingContexts.join(', ')}`);
      return;
    }

    onSave(contexts);
    toast.success('Contextes des campagnes sauvegardés');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contextes des campagnes</CardTitle>
          <CardDescription>
            Renseignez le contexte spécifique pour chaque campagne trouvée dans votre feuille.
            Ces contextes seront utilisés pour personnaliser la génération de contenu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Campagnes détectées : <Badge variant="secondary">{campaigns.length}</Badge>
            </p>
          </div>

          {campaigns.map((campaign, index) => (
            <div key={campaign} className="space-y-2">
              <label className="text-sm font-medium">
                Campagne #{index + 1}: <span className="font-bold text-primary">{campaign}</span>
              </label>
              <Textarea
                placeholder={`Décrivez le contexte, l'objectif, la cible de la campagne "${campaign}"...`}
                value={contexts[campaign] || ''}
                onChange={(e) => handleContextChange(campaign, e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Exemple : "Campagne de promotion des services comptables pour PME, cible : dirigeants d'entreprises 10-50 salariés"
              </p>
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} className="flex-1">
              Sauvegarder les contextes
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};