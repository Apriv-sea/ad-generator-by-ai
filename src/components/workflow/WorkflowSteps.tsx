import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Database, Brain, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Client } from "@/services/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Composants optimisés
import ClientSelector from "../ClientSelector";
import GoogleSheetsAuth from '../auth/GoogleSheetsAuth';
import GoogleSheetsEmbed from '../sheet/GoogleSheetsEmbed';
import CampaignExtractorWorkflow from '../campaign/CampaignExtractorWorkflow';
import ContentGeneratorWorkflow from '../campaign/ContentGeneratorWorkflow';
import WorkflowStepIndicator from './WorkflowStepIndicator';

// Hooks et types
import { useWorkflowState } from '@/hooks/useWorkflowState';
import { WorkflowStepConfig } from '@/types/workflow';

interface WorkflowStepsProps {
  onWorkflowComplete?: () => void;
}

const WorkflowSteps: React.FC<WorkflowStepsProps> = ({ onWorkflowComplete }) => {
  // Hook centralisé pour la gestion d'état
  const {
    workflowState,
    setClientAndProgress,
    setAuthAndProgress,
    setSheetAndProgress,
    setCampaignsAndProgress
  } = useWorkflowState();

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

  // Configuration des étapes du workflow
  const stepConfigs: WorkflowStepConfig[] = [
    {
      id: 'client',
      title: 'Sélection du client',
      description: 'Choisissez le client pour cette campagne',
      icon: User,
      color: 'blue',
      isComplete: workflowState.completed.has('client'),
      isCurrent: workflowState.currentStep === 'client'
    },
    {
      id: 'auth',
      title: 'Authentification Google',
      description: 'Connectez-vous à Google Sheets',
      icon: Database,
      color: 'green',
      isComplete: workflowState.completed.has('auth'),
      isCurrent: workflowState.currentStep === 'auth'
    },
    {
      id: 'connect',
      title: 'Connexion feuille',
      description: 'Connectez votre feuille Google Sheets',
      icon: FileSpreadsheet,
      color: 'emerald',
      isComplete: workflowState.completed.has('connect'),
      isCurrent: workflowState.currentStep === 'connect'
    },
    {
      id: 'extract',
      title: 'Extraction données',
      description: 'Analysez et extrayez les campagnes',
      icon: Database,
      color: 'purple',
      isComplete: workflowState.completed.has('extract'),
      isCurrent: workflowState.currentStep === 'extract'
    },
    {
      id: 'generate',
      title: 'Génération IA',
      description: 'Générez le contenu avec l\'IA',
      icon: Brain,
      color: 'indigo',
      isComplete: workflowState.completed.has('generate'),
      isCurrent: workflowState.currentStep === 'generate'
    }
  ];

  // Gestionnaires d'événements optimisés
  const handleClientSelected = (client: Client) => {
    console.log('Client sélectionné:', client);
    setClientAndProgress(client);
  };

  const handleAuthSuccess = () => {
    console.log('Authentification Google réussie');
    setAuthAndProgress();
  };

  const handleSheetConnected = (sheetId: string, sheetData?: any) => {
    console.log('Feuille connectée:', sheetId, sheetData);
    setSheetAndProgress(sheetId, sheetData);
  };

  const handleCampaignsExtracted = (campaigns: any[]) => {
    console.log('Campagnes extraites:', campaigns);
    setCampaignsAndProgress(campaigns);
  };

  const handleContentGenerated = () => {
    console.log('Contenu généré avec succès');
    toast.success('Workflow terminé avec succès !');
    onWorkflowComplete?.();
  };

  return (
    <div className="space-y-8">
      {/* Indicateur de progression */}
      <WorkflowStepIndicator steps={stepConfigs} />

      {/* Étape courante */}
      {workflowState.currentStep === 'client' && (
        <Card>
          <CardHeader>
            <CardTitle>Étape 1 : Sélection du client</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientSelector 
              clients={clients} 
              isLoading={isLoadingClients} 
              onClientSelected={handleClientSelected}
              selectedClient={workflowState.data.selectedClient}
            />
          </CardContent>
        </Card>
      )}

      {workflowState.currentStep === 'auth' && (
        <Card>
          <CardHeader>
            <CardTitle>Étape 2 : Authentification Google Sheets</CardTitle>
          </CardHeader>
          <CardContent>
            <GoogleSheetsAuth onAuthSuccess={handleAuthSuccess} />
          </CardContent>
        </Card>
      )}

      {workflowState.currentStep === 'connect' && (
        <Card>
          <CardHeader>
            <CardTitle>Étape 3 : Connexion à votre feuille</CardTitle>
          </CardHeader>
          <CardContent>
            <GoogleSheetsEmbed
              onConnectionSuccess={handleSheetConnected}
              onSheetUrlChange={() => {}}
            />
          </CardContent>
        </Card>
      )}

      {workflowState.currentStep === 'extract' && workflowState.data.sheetData && (
        <Card>
          <CardHeader>
            <CardTitle>Étape 4 : Extraction des données</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignExtractorWorkflow
              sheetId={workflowState.data.connectedSheetId || ''}
              sheetData={workflowState.data.sheetData?.values || null}
              clientInfo={workflowState.data.selectedClient}
              onCampaignsExtracted={handleCampaignsExtracted}
            />
          </CardContent>
        </Card>
      )}

      {workflowState.currentStep === 'generate' && workflowState.data.extractedCampaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Étape 5 : Génération de contenu IA</CardTitle>
          </CardHeader>
          <CardContent>
            <ContentGeneratorWorkflow
              campaigns={workflowState.data.extractedCampaigns}
              clientInfo={workflowState.data.selectedClient}
              sheetId={workflowState.data.connectedSheetId || ''}
              onContentGenerated={handleContentGenerated}
            />
          </CardContent>
        </Card>
      )}

      {/* Problèmes détectés */}
      {workflowState.currentStep === 'extract' && !workflowState.data.sheetData && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            Aucune donnée de feuille disponible. Assurez-vous d'avoir connecté une feuille Google Sheets à l'étape précédente.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default WorkflowSteps;