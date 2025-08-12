// Workflow simplifié en 3 étapes : Setup → Import → Generate
// Focus sur UX claire avec preview obligatoire

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, Circle, ArrowRight, Clock, DollarSign, 
  Settings, FileSpreadsheet, Wand2, Info, Eye 
} from "lucide-react";

// Étapes du workflow
import SetupStep from "./steps/SetupStep";
import ImportStep from "./steps/ImportStep"; 
import GenerateStep from "./steps/GenerateStep";

interface ProjectWorkflowProps {
  onProjectCreated: (project: any) => void;
}

type WorkflowStep = 'setup' | 'import' | 'generate';

interface WorkflowData {
  projectName: string;
  selectedClient: any;
  sheetUrl: string;
  sheetData: any;
  estimatedCost: number;
  estimatedTime: number;
  generatedContent: any;
}

const ProjectWorkflow: React.FC<ProjectWorkflowProps> = ({ onProjectCreated }) => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('setup');
  const [completedSteps, setCompletedSteps] = useState<Set<WorkflowStep>>(new Set());
  const [workflowData, setWorkflowData] = useState<WorkflowData>({
    projectName: '',
    selectedClient: null,
    sheetUrl: '',
    sheetData: null,
    estimatedCost: 0,
    estimatedTime: 0,
    generatedContent: null
  });

  const steps = [
    {
      id: 'setup' as WorkflowStep,
      title: 'Configuration',
      description: 'Projet et client',
      icon: Settings,
      color: 'text-blue-600'
    },
    {
      id: 'import' as WorkflowStep,
      title: 'Import',
      description: 'Google Sheets',
      icon: FileSpreadsheet,
      color: 'text-green-600'
    },
    {
      id: 'generate' as WorkflowStep,
      title: 'Génération',
      description: 'Preview et IA',
      icon: Wand2,
      color: 'text-purple-600'
    }
  ];

  const updateWorkflowData = (updates: Partial<WorkflowData>) => {
    setWorkflowData(prev => ({ ...prev, ...updates }));
  };

  const completeStep = (step: WorkflowStep) => {
    setCompletedSteps(prev => new Set([...prev, step]));
    
    // Passer à l'étape suivante automatiquement
    const stepIndex = steps.findIndex(s => s.id === step);
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].id);
    }
  };

  const goToStep = (step: WorkflowStep) => {
    // Permettre seulement si l'étape précédente est complétée
    const stepIndex = steps.findIndex(s => s.id === step);
    const canAccess = stepIndex === 0 || completedSteps.has(steps[stepIndex - 1].id);
    
    if (canAccess) {
      setCurrentStep(step);
    }
  };

  const getStepStatus = (step: WorkflowStep) => {
    if (completedSteps.has(step)) return 'completed';
    if (currentStep === step) return 'current';
    return 'pending';
  };

  const getProgressPercentage = () => {
    const completedCount = completedSteps.size;
    const currentStepBonus = currentStep !== 'setup' ? 0.5 : 0;
    return ((completedCount + currentStepBonus) / steps.length) * 100;
  };

  const renderStepIndicator = () => (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Création de Projet</CardTitle>
            <p className="text-sm text-muted-foreground">
              Workflow simplifié en 3 étapes
            </p>
          </div>
          <Badge variant="outline">
            {completedSteps.size}/{steps.length} étapes
          </Badge>
        </div>
        
        <Progress value={getProgressPercentage()} className="mt-4" />
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center space-x-8">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const IconComponent = step.icon;
            
            return (
              <div key={step.id} className="flex items-center space-x-2">
                <div 
                  className={`relative flex items-center cursor-pointer ${
                    status === 'pending' ? 'opacity-50' : ''
                  }`}
                  onClick={() => goToStep(step.id)}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                    ${status === 'completed' 
                      ? 'bg-green-100 border-green-500 text-green-700' 
                      : status === 'current'
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-gray-100 border-gray-300 text-gray-500'
                    }
                  `}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <IconComponent className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="ml-3">
                    <p className={`font-medium text-sm ${
                      status === 'current' ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderEstimates = () => {
    if (!workflowData.estimatedCost && !workflowData.estimatedTime) return null;
    
    return (
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center space-x-6">
            {workflowData.estimatedTime > 0 && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm">
                  Temps estimé: {workflowData.estimatedTime}s
                </span>
              </div>
            )}
            
            {workflowData.estimatedCost > 0 && (
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm">
                  Coût estimé: {workflowData.estimatedCost.toFixed(2)}€
                </span>
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="space-y-6">
      {renderStepIndicator()}
      {renderEstimates()}
      
      {/* Étape courante */}
      {currentStep === 'setup' && (
        <SetupStep 
          data={workflowData}
          onDataUpdate={updateWorkflowData}
          onComplete={() => completeStep('setup')}
        />
      )}
      
      {currentStep === 'import' && (
        <ImportStep 
          data={workflowData}
          onDataUpdate={updateWorkflowData}
          onComplete={() => completeStep('import')}
        />
      )}
      
      {currentStep === 'generate' && (
        <GenerateStep 
          data={workflowData}
          onDataUpdate={updateWorkflowData}
          onComplete={(finalProject) => {
            completeStep('generate');
            onProjectCreated(finalProject);
          }}
        />
      )}
    </div>
  );
};

export default ProjectWorkflow;