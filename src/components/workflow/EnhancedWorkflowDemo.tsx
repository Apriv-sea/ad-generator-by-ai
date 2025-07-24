import React, { useState } from 'react';
import { ProgressIndicator } from '@/components/navigation/ProgressIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileSpreadsheet, Wand2, Download } from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  status: 'completed' | 'current' | 'pending' | 'error';
  description?: string;
}

export const EnhancedWorkflowDemo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const workflowSteps: WorkflowStep[] = [
    {
      id: 'client-setup',
      title: 'Configuration client',
      status: currentStep > 0 ? 'completed' : currentStep === 0 ? 'current' : 'pending',
      description: 'Définir les informations du client et son contexte métier'
    },
    {
      id: 'campaign-setup',
      title: 'Création campagne',
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'pending',
      description: 'Configurer les groupes d\'annonces et mots-clés'
    },
    {
      id: 'content-generation',
      title: 'Génération IA',
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'pending',
      description: 'Générer les titres et descriptions automatiquement'
    },
    {
      id: 'export',
      title: 'Export & Validation',
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'current' : 'pending',
      description: 'Exporter vers Google Sheets et valider les résultats'
    }
  ];

  const nextStep = () => {
    if (currentStep < workflowSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetWorkflow = () => {
    setCurrentStep(0);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Workflow de Génération de Campagne
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ProgressIndicator 
          steps={workflowSteps}
          currentStepIndex={currentStep}
          title="Progression de votre campagne"
        />

        {/* Current Step Content */}
        <div className="p-6 bg-accent/10 rounded-lg border">
          <h3 className="font-semibold text-lg mb-2">
            Étape {currentStep + 1}: {workflowSteps[currentStep]?.title}
          </h3>
          <p className="text-muted-foreground mb-4">
            {workflowSteps[currentStep]?.description}
          </p>

          {/* Step-specific content */}
          {currentStep === 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Sélectionnez ou créez un client pour personnaliser la génération
            </div>
          )}
          
          {currentStep === 1 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" />
              Définissez vos groupes d'annonces et mots-clés cibles
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wand2 className="h-4 w-4" />
              L'IA génère automatiquement le contenu optimisé
            </div>
          )}
          
          {currentStep === 3 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Download className="h-4 w-4" />
              Exportez vos campagnes vers Google Sheets ou téléchargez en CSV
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Précédent
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={resetWorkflow}>
              Recommencer
            </Button>
            
            <Button 
              onClick={nextStep}
              disabled={currentStep === workflowSteps.length - 1}
            >
              {currentStep === workflowSteps.length - 1 ? 'Terminé' : 'Suivant'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};