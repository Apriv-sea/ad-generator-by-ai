
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Client } from "@/services/types";
import ClientSelector from "./ClientSelector";
import SheetIdInput from "../sheet/SheetIdInput";
import CampaignExtractorWorkflow from "./CampaignExtractorWorkflow";
import ContentGeneratorWorkflow from "./ContentGeneratorWorkflow";

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

const CampaignWorkflow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [sheetId, setSheetId] = useState<string>("");
  const [sheetData, setSheetData] = useState<any[][] | null>(null);
  const [extractedCampaigns, setExtractedCampaigns] = useState<any[]>([]);

  const steps: WorkflowStep[] = [
    {
      id: "client",
      title: "Sélection du client",
      description: "Choisissez le client pour cette campagne",
      completed: !!selectedClient
    },
    {
      id: "sheet",
      title: "Connexion Google Sheets",
      description: "Connectez votre feuille Google Sheets",
      completed: !!sheetData
    },
    {
      id: "extraction",
      title: "Extraction des campagnes",
      description: "Extraction et validation des données",
      completed: extractedCampaigns.length > 0
    },
    {
      id: "generation",
      title: "Génération de contenu",
      description: "Génération automatique par IA",
      completed: false
    }
  ];

  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client);
    if (client && currentStep === 0) {
      setCurrentStep(1);
    }
  };

  const handleSheetLoaded = (id: string, data: any) => {
    setSheetId(id);
    setSheetData(data.values);
    if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  const handleCampaignsExtracted = (campaigns: any[]) => {
    setExtractedCampaigns(campaigns);
    if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ClientSelector
            selectedClientId={selectedClient?.id}
            onClientSelect={handleClientSelect}
            showCreateOption={true}
          />
        );
      
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Connexion à votre Google Sheets</CardTitle>
            </CardHeader>
            <CardContent>
              <SheetIdInput onSheetLoaded={handleSheetLoaded} />
            </CardContent>
          </Card>
        );
      
      case 2:
        return (
          <CampaignExtractorWorkflow
            sheetId={sheetId}
            sheetData={sheetData}
            clientInfo={selectedClient}
            onCampaignsExtracted={handleCampaignsExtracted}
          />
        );
      
      case 3:
        return (
          <ContentGeneratorWorkflow
            sheetId={sheetId}
            sheetData={sheetData}
            campaigns={extractedCampaigns}
            clientInfo={selectedClient}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Assistant de Campagnes Publicitaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 overflow-x-auto pb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center space-x-2 min-w-max">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step.completed 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : index === currentStep
                    ? 'border-blue-500 text-blue-500'
                    : 'border-gray-300 text-gray-300'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="text-sm">
                  <div className={`font-medium ${
                    index === currentStep ? 'text-blue-600' : step.completed ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-gray-500 text-xs">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mb-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Étape précédente
        </Button>
        
        <Button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1 || !steps[currentStep].completed}
        >
          Étape suivante
        </Button>
      </div>

      {/* Current Step Content */}
      {renderStep()}
    </div>
  );
};

export default CampaignWorkflow;
