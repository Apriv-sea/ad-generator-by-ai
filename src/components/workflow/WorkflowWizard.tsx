
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import SheetValidationStep from './steps/SheetValidationStep';
import DataPreviewStep from './steps/DataPreviewStep';
import AIModelSelectionStep from './steps/AIModelSelectionStep';
import ResultMappingStep from './steps/ResultMappingStep';
import { WorkflowExecution } from '@/services/workflow/types';

interface WorkflowWizardProps {
  onComplete: (execution: WorkflowExecution) => void;
}

const WorkflowWizard: React.FC<WorkflowWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepData] = useState<Record<string, any>>({});

  const steps = [
    {
      id: 'sheet-validation',
      title: 'Configuration de la feuille',
      component: SheetValidationStep
    },
    {
      id: 'data-preview',
      title: 'Aperçu des données',
      component: DataPreviewStep
    },
    {
      id: 'ai-selection',
      title: 'Sélection du modèle IA',
      component: AIModelSelectionStep
    },
    {
      id: 'result-mapping',
      title: 'Configuration des résultats',
      component: ResultMappingStep
    }
  ];

  const handleStepComplete = (stepId: string, data: any) => {
    setStepData(prev => ({ ...prev, [stepId]: data }));
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const currentStepConfig = steps[currentStep];
  const StepComponent = currentStepConfig.component;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index + 1}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">
              {step.title}
            </span>
            {index < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 mx-4 text-gray-400" />
            )}
          </div>
        ))}
      </div>

      {/* Current Step */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStepConfig.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <StepComponent
            data={stepData[currentStepConfig.id]}
            onComplete={(data) => handleStepComplete(currentStepConfig.id, data)}
            previousData={stepData}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousStep}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Étape précédente
        </Button>

        <div className="text-sm text-gray-500">
          Étape {currentStep + 1} sur {steps.length}
        </div>
      </div>
    </div>
  );
};

export default WorkflowWizard;
