/**
 * Composant réutilisable pour l'indicateur d'étapes du workflow
 */

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { WorkflowStepConfig } from "@/types/workflow";

interface WorkflowStepIndicatorProps {
  steps: WorkflowStepConfig[];
}

const WorkflowStepIndicator: React.FC<WorkflowStepIndicatorProps> = ({ steps }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {/* Ligne de progression */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border z-0"></div>
        
        {steps.map((step, index) => {
          const IconComponent = step.icon;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                ${step.isComplete 
                  ? 'bg-primary text-primary-foreground' 
                  : step.isCurrent
                    ? `bg-${step.color}-100 text-${step.color}-600 border-2 border-${step.color}-300`
                    : 'bg-muted text-muted-foreground'
                }
              `}>
                {step.isComplete ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <IconComponent className="w-4 h-4" />
                )}
              </div>
              
              <div className="mt-2 text-center max-w-[120px]">
                <p className={`text-xs font-medium ${
                  step.isCurrent ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </p>
                
                {step.isComplete && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Terminé
                  </Badge>
                )}
                
                {step.isCurrent && !step.isComplete && (
                  <Badge variant="default" className="mt-1 text-xs">
                    En cours
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowStepIndicator;