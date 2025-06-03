
export interface WorkflowStep<TInput = any, TOutput = any> {
  id: string;
  name: string;
  description: string;
  execute: (input: TInput, context: WorkflowContext) => Promise<TOutput>;
  validate: (input: TInput) => ValidationResult;
}

export interface WorkflowContext {
  metadata: Record<string, any>;
  previousResults: Record<string, any>;
  abortSignal?: AbortSignal;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStepIndex: number;
  results: Record<string, any>;
  errors: WorkflowError[];
  startedAt: Date;
  completedAt?: Date;
}

export interface WorkflowError {
  stepId: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Types spécifiques pour notre workflow Google Sheets
export interface SheetValidationInput {
  sheetId: string;
}

export interface SheetValidationOutput {
  isValid: boolean;
  hasRequiredColumns: boolean;
  data: any[][];
  suggestTemplate: boolean;
  templateType?: string;
}

export interface DataExtractionOutput {
  campaigns: any[];
  clientInfo: any;
  rawData: any[][];
}

export interface PromptGenerationInput {
  extractedData: DataExtractionOutput;
  template: string;
}

export interface AIGenerationInput {
  prompt: string;
  model: string;
  parameters: Record<string, any>;
}

export interface SheetUpdateInput {
  sheetId: string;
  generatedContent: any;
  targetCells: string[];
}
