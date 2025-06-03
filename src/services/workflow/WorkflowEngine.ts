
import { WorkflowDefinition, WorkflowExecution, WorkflowStep, WorkflowContext, WorkflowError } from './types';
import { toast } from 'sonner';

export class WorkflowEngine {
  private executions: Map<string, WorkflowExecution> = new Map();

  async executeWorkflow(
    definition: WorkflowDefinition,
    initialInput: any,
    context: WorkflowContext = { metadata: {}, previousResults: {} }
  ): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: this.generateExecutionId(),
      workflowId: definition.id,
      status: 'running',
      currentStepIndex: 0,
      results: {},
      errors: [],
      startedAt: new Date()
    };

    this.executions.set(execution.id, execution);

    try {
      let currentInput = initialInput;

      for (let i = 0; i < definition.steps.length; i++) {
        const step = definition.steps[i];
        execution.currentStepIndex = i;

        console.log(`Executing step ${i + 1}/${definition.steps.length}: ${step.name}`);

        // Validation avant exécution
        const validationResult = step.validate(currentInput);
        if (!validationResult.isValid) {
          const error: WorkflowError = {
            stepId: step.id,
            message: `Validation failed: ${validationResult.errors?.join(', ')}`,
            details: validationResult,
            timestamp: new Date()
          };
          execution.errors.push(error);
          execution.status = 'failed';
          toast.error(`Erreur à l'étape "${step.name}": ${error.message}`);
          return execution;
        }

        // Exécution de l'étape
        try {
          const stepResult = await step.execute(currentInput, context);
          execution.results[step.id] = stepResult;
          context.previousResults[step.id] = stepResult;
          currentInput = stepResult;

          toast.success(`Étape "${step.name}" terminée avec succès`);
        } catch (stepError) {
          const error: WorkflowError = {
            stepId: step.id,
            message: stepError.message || 'Erreur inconnue',
            details: stepError,
            timestamp: new Date()
          };
          execution.errors.push(error);
          execution.status = 'failed';
          toast.error(`Erreur lors de l'exécution de "${step.name}": ${error.message}`);
          return execution;
        }
      }

      execution.status = 'completed';
      execution.completedAt = new Date();
      toast.success(`Workflow "${definition.name}" terminé avec succès !`);

    } catch (error) {
      execution.status = 'failed';
      execution.errors.push({
        stepId: 'workflow',
        message: error.message || 'Erreur générale du workflow',
        details: error,
        timestamp: new Date()
      });
      toast.error(`Workflow échoué: ${error.message}`);
    }

    return execution;
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const workflowEngine = new WorkflowEngine();
