import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  status: 'completed' | 'current' | 'pending' | 'error';
  description?: string;
}

interface ProgressIndicatorProps {
  steps: WorkflowStep[];
  currentStepIndex: number;
  title?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStepIndex,
  title = "Progression du workflow"
}) => {
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  const getStepIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'current':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="text-green-700 bg-green-100">Terminé</Badge>;
      case 'current':
        return <Badge variant="default">En cours</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="outline">En attente</Badge>;
    }
  };

  return (
    <div className="space-y-4 p-4 bg-card border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-card-foreground">{title}</h3>
        <span className="text-sm text-muted-foreground">
          {completedSteps}/{steps.length} étapes
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Début</span>
          <span>{Math.round(progressPercentage)}% terminé</span>
          <span>Fin</span>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`flex items-center gap-3 p-2 rounded transition-colors ${
              step.status === 'current' ? 'bg-accent/50' : ''
            }`}
          >
            {getStepIcon(step.status)}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${
                  step.status === 'current' ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
                {getStatusBadge(step.status)}
              </div>
              
              {step.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </p>
              )}
            </div>

            <span className="text-xs text-muted-foreground font-mono">
              {index + 1}/{steps.length}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};