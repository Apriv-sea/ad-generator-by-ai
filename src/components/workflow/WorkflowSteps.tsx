import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ArrowRight, User, Database, Brain, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Client } from "@/services/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ClientSelector from "../ClientSelector";
import GoogleSheetsAuth from '../auth/GoogleSheetsAuth';
import GoogleSheetsEmbed from '../sheet/GoogleSheetsEmbed';
import CampaignExtractorWorkflow from '../campaign/CampaignExtractorWorkflow';
import ContentGeneratorWorkflow from '../campaign/ContentGeneratorWorkflow';

interface WorkflowStepsProps {
  onWorkflowComplete?: () => void;
}

export type WorkflowStep = 'client' | 'auth' | 'connect' | 'extract' | 'generate';

interface WorkflowState {
  currentStep: WorkflowStep;
  completed: Set<WorkflowStep>;
  data: {
    selectedClient: Client | null;
    isAuthenticated: boolean;
    connectedSheetId: string | null;
    sheetData: any;
    extractedCampaigns: any[];
  };
}

const WorkflowSteps: React.FC<WorkflowStepsProps> = ({ onWorkflowComplete }) => {
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    currentStep: 'client',
    completed: new Set(),
    data: {
      selectedClient: null,
      isAuthenticated: false,
      connectedSheetId: null,
      sheetData: null,
      extractedCampaigns: []
    }
  });

  // Récupérer les clients
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data.map(client => ({
        id: client.id,
        name: client.name,
        businessContext: client.business_context,
        specifics: client.specifics,
        editorialGuidelines: client.editorial_guidelines
      }));
    }
  });

  const steps = [
    {
      id: 'client' as WorkflowStep,
      title: 'Sélection du client',
      description: 'Choisissez le client pour cette campagne',
      icon: User,
      color: 'blue'
    },
    {
      id: 'auth' as WorkflowStep,
      title: 'Authentification Google',
      description: 'Connectez-vous à Google Sheets',
      icon: Database,
      color: 'green'
    },
    {
      id: 'connect' as WorkflowStep,
      title: 'Connexion feuille',
      description: 'Connectez votre feuille Google Sheets',
      icon: FileSpreadsheet,
      color: 'emerald'
    },
    {
      id: 'extract' as WorkflowStep,
      title: 'Extraction données',
      description: 'Analysez et extrayez les campagnes',
      icon: Database,
      color: 'purple'
    },
    {
      id: 'generate' as WorkflowStep,
      title: 'Génération IA',
      description: 'Générez le contenu avec l\'IA',
      icon: Brain,
      color: 'orange'
    }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === workflowState.currentStep);
  };

  const isStepCompleted = (stepId: WorkflowStep) => {
    return workflowState.completed.has(stepId);
  };

  const isStepAccessible = (stepId: WorkflowStep) => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    const currentIndex = getCurrentStepIndex();
    
    // La première étape est toujours accessible
    if (stepIndex === 0) return true;
    
    // Les autres étapes ne sont accessibles que si l'étape précédente est complétée
    const previousStep = steps[stepIndex - 1];
    return previousStep ? isStepCompleted(previousStep.id) : false;
  };

  const completeStep = (stepId: WorkflowStep, data?: any) => {
    setWorkflowState(prev => ({
      ...prev,
      completed: new Set([...prev.completed, stepId]),
      data: { ...prev.data, ...data }
    }));
    
    // Passer à l'étape suivante automatiquement
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      setWorkflowState(prev => ({
        ...prev,
        currentStep: nextStep.id
      }));
    }
  };

  const goToStep = (stepId: WorkflowStep) => {
    if (isStepAccessible(stepId)) {
      setWorkflowState(prev => ({
        ...prev,
        currentStep: stepId
      }));
    }
  };

  const handleClientSelected = (clientId: string, client: Client) => {
    console.log('Client sélectionné:', client);
    completeStep('client', { selectedClient: client });
    toast.success(`Client "${client.name}" sélectionné`);
  };

  const handleAuthSuccess = () => {
    console.log('Authentification réussie');
    completeStep('auth', { isAuthenticated: true });
    toast.success('Authentification Google Sheets réussie');
  };

  const handleConnectionSuccess = (sheetId: string, sheetData?: any) => {
    console.log('Connexion feuille réussie:', sheetId, sheetData);
    // Récupérer les données de la feuille après connexion
    completeStep('connect', { 
      connectedSheetId: sheetId,
      sheetData: sheetData || null 
    });
    toast.success('Feuille Google Sheets connectée');
  };

  const handleCampaignsExtracted = (campaigns: any[]) => {
    console.log('Campagnes extraites:', campaigns);
    completeStep('extract', { extractedCampaigns: campaigns });
    toast.success(`${campaigns.length} campagnes extraites`);
  };

  const renderStepContent = () => {
    switch (workflowState.currentStep) {
      case 'client':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Sélectionnez un client</h3>
              <p className="text-muted-foreground">
                Choisissez le client pour lequel vous souhaitez créer cette campagne
              </p>
            </div>
            
            <ClientSelector
              clients={clients}
              selectedClient={workflowState.data.selectedClient?.id || null}
              onClientSelect={handleClientSelected}
              isLoading={isLoadingClients}
              className="max-w-md mx-auto"
            />
            
            {workflowState.data.selectedClient && (
              <Alert className="max-w-md mx-auto">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Client sélectionné: <strong>{workflowState.data.selectedClient.name}</strong>
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'auth':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Authentification Google Sheets</h3>
              <p className="text-muted-foreground">
                Connectez-vous à votre compte Google pour accéder à vos feuilles
              </p>
            </div>
            
            <GoogleSheetsAuth onAuthSuccess={handleAuthSuccess} />
          </div>
        );

      case 'connect':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Connexion à votre feuille</h3>
              <p className="text-muted-foreground">
                Connectez la feuille Google Sheets contenant vos données de campagne
              </p>
            </div>
            
            <GoogleSheetsEmbed
              onConnectionSuccess={(sheetId) => handleConnectionSuccess(sheetId)}
              onSheetUrlChange={() => {}}
            />
          </div>
        );

      case 'extract':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Extraction des campagnes</h3>
              <p className="text-muted-foreground">
                Analysez et extrayez les données de vos campagnes
              </p>
            </div>
            
            {workflowState.data.connectedSheetId ? (
              <CampaignExtractorWorkflow
                sheetId={workflowState.data.connectedSheetId}
                sheetData={workflowState.data.sheetData}
                clientInfo={workflowState.data.selectedClient}
                onCampaignsExtracted={handleCampaignsExtracted}
                onClientInfoUpdated={() => {}}
              />
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucune feuille connectée. Retournez à l'étape précédente pour connecter une feuille Google Sheets.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'generate':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Génération de contenu IA</h3>
              <p className="text-muted-foreground">
                Générez du contenu optimisé avec l'intelligence artificielle
              </p>
            </div>
            
            {workflowState.data.connectedSheetId && workflowState.data.extractedCampaigns.length > 0 && (
              <ContentGeneratorWorkflow
                sheetId={workflowState.data.connectedSheetId}
                sheetData={null} // Les données seront rechargées
                campaigns={workflowState.data.extractedCampaigns}
                clientInfo={workflowState.data.selectedClient}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Progress Bar */}
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-2xl font-bold text-center mb-6">Workflow de Campagne</h2>
        
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const isCompleted = isStepCompleted(step.id);
            const isCurrent = workflowState.currentStep === step.id;
            const isAccessible = isStepAccessible(step.id);
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <Button
                    variant={isCurrent ? "default" : isCompleted ? "secondary" : "outline"}
                    size="sm"
                    className={`w-12 h-12 rounded-full p-0 ${
                      isAccessible && !isCurrent ? 'cursor-pointer hover:bg-primary/10' : ''
                    }`}
                    onClick={() => isAccessible ? goToStep(step.id) : undefined}
                    disabled={!isAccessible}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </Button>
                  
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground max-w-24">{step.description}</p>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 mx-4 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>

        {/* Current Step Badge */}
        <div className="text-center">
          <Badge variant="outline" className="text-sm">
            Étape {getCurrentStepIndex() + 1} sur {steps.length}: {steps[getCurrentStepIndex()]?.title}
          </Badge>
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-8">
          {renderStepContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowSteps;