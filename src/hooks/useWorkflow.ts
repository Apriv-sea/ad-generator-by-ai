
import { useState, useCallback } from 'react';
import { WorkflowDefinition, WorkflowExecution } from '@/services/workflow/types';
import { workflowEngine } from '@/services/workflow/WorkflowEngine';
import { SheetValidationStep } from '@/services/workflow/steps/SheetValidationStep';

export function useWorkflow() {
  const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const createGoogleSheetsWorkflow = (): WorkflowDefinition => {
    return {
      id: 'google-sheets-ai-workflow',
      name: 'Workflow Google Sheets → IA',
      description: 'Extraction, traitement et génération de contenu via IA',
      steps: [
        new SheetValidationStep(),
        // Les autres étapes seront ajoutées progressivement
      ]
    };
  };

  const executeWorkflow = useCallback(async (initialInput: any) => {
    setIsRunning(true);
    try {
      const workflow = createGoogleSheetsWorkflow();
      const execution = await workflowEngine.executeWorkflow(workflow, initialInput);
      setCurrentExecution(execution);
      return execution;
    } finally {
      setIsRunning(false);
    }
  }, []);

  const getExecutionStatus = useCallback((executionId: string) => {
    return workflowEngine.getExecution(executionId);
  }, []);

  return {
    currentExecution,
    isRunning,
    executeWorkflow,
    getExecutionStatus,
    createGoogleSheetsWorkflow
  };
}
