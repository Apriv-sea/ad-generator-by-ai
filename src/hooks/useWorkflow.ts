
import { useState, useCallback } from 'react';
import { WorkflowDefinition, WorkflowExecution } from '@/services/workflow/types';
import { workflowEngine } from '@/services/workflow/WorkflowEngine';

export function useWorkflow() {
  const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const createCryptPadWorkflow = (): WorkflowDefinition => {
    return {
      id: 'cryptpad-ai-workflow',
      name: 'Workflow CryptPad → IA',
      description: 'Extraction, traitement et génération de contenu via IA avec CryptPad',
      steps: [
        // Les étapes seront ajoutées progressivement
      ]
    };
  };

  const executeWorkflow = useCallback(async (initialInput: any) => {
    setIsRunning(true);
    try {
      const workflow = createCryptPadWorkflow();
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
    createCryptPadWorkflow
  };
}
