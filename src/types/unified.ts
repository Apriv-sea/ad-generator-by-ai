// Types unifiés - Point central pour toutes les interfaces
// Remplace les types dupliqués dans 20+ fichiers

// ==================== CORE ENTITIES ====================

export interface Client {
  id: string;
  name: string;
  industry?: string;
  targetPersona?: string;
  businessContext?: string;
  specifics?: string;
  editorialGuidelines?: string;
}

export interface Sheet {
  id: string;
  name?: string;
  url?: string;
  isConnected?: boolean;
  lastModified?: string;
  rowCount?: number;
  columnCount?: number;
}

export interface Campaign {
  id: string;
  sheetId: string;
  name?: string;
  context?: string;
  adGroups?: AdGroup[];
  status?: 'draft' | 'active' | 'paused' | 'completed';
}

export interface AdGroup {
  id: string;
  campaignId: string;
  name: string;
  keywords: string[];
  context?: string;
  titles?: string[];
  descriptions?: string[];
}

// ==================== CONTENT GENERATION ====================

export interface GenerationOptions {
  model: string;
  client: Client;
  campaign: Campaign;
  adGroup: AdGroup;
  industry?: string;
  targetPersona?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GeneratedContent {
  titles: string[];
  descriptions: string[];
  metadata: GenerationMetadata;
}

export interface GenerationMetadata {
  model: string;
  promptId: string;
  industry: string;
  timestamp: string;
  validationScore: number;
  processingTime: number;
  retryCount: number;
}

// ==================== VALIDATION ====================

export interface ValidationResult {
  isValid: boolean;
  score: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  correctedContent?: GeneratedContent;
  suggestions?: string[];
}

export interface ValidationError {
  type: 'length' | 'format' | 'content' | 'structure';
  field: 'title' | 'description';
  index?: number;
  message: string;
  value?: string;
  expected?: string;
}

export interface ValidationWarning {
  type: 'quality' | 'performance' | 'optimization';
  message: string;
  suggestion?: string;
}

// ==================== RESPONSES ====================

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  metadata?: ResponseMetadata;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  retryable?: boolean;
}

export interface ResponseMetadata {
  requestId: string;
  timestamp: string;
  processingTime: number;
  cacheHit?: boolean;
}

// ==================== SHEET DATA ====================

export interface SheetData {
  id: string;
  values: string[][];
  headers?: string[];
  metadata: SheetMetadata;
}

export interface SheetMetadata {
  id: string;
  name: string;
  lastModified: string;
  rowCount: number;
  columnCount: number;
  structure: ColumnStructure;
}

export interface ColumnStructure {
  titleColumns: number[];
  descriptionColumns: number[];
  protectedColumns: number[];
  keywordColumn?: number;
  campaignColumn?: number;
  adGroupColumn?: number;
}

// ==================== UTILITIES ====================

export type PromptVariable = {
  key: string;
  value: string;
  required: boolean;
}

export type IndustryConfig = {
  name: string;
  keywords: string[];
  actionWords: string[];
  urgencyTactics: string[];
  valuePropositions: string[];
  callsToAction: string[];
  tone: 'professional' | 'casual' | 'urgent' | 'friendly';
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: any;
  timestamp: string;
  source: string;
}

// ==================== STATUS & STATE ====================

export type ProcessingStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';

export interface ProcessingState {
  status: ProcessingStatus;
  progress: number;
  currentStep?: string;
  totalSteps?: number;
  estimatedTime?: number;
  error?: ServiceError;
}

// ==================== TYPE GUARDS ====================

export const isClient = (obj: any): obj is Client => {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
};

export const isSheet = (obj: any): obj is Sheet => {
  return obj && typeof obj.id === 'string';
};

export const isCampaign = (obj: any): obj is Campaign => {
  return obj && typeof obj.id === 'string' && typeof obj.sheetId === 'string';
};

export const isValidationResult = (obj: any): obj is ValidationResult => {
  return obj && typeof obj.isValid === 'boolean' && Array.isArray(obj.errors);
};

// ==================== CONSTANTS ====================

export const LIMITS = {
  TITLE_MAX_LENGTH: 30,
  DESCRIPTION_MAX_LENGTH: 90,
  DESCRIPTION_MIN_LENGTH: 55,
  REQUIRED_TITLES_COUNT: 15,
  REQUIRED_DESCRIPTIONS_COUNT: 4,
  MAX_KEYWORDS_PER_ADGROUP: 50,
  MAX_RETRY_ATTEMPTS: 3,
  BATCH_SIZE: 10
} as const;

export const PROTECTED_COLUMNS: readonly number[] = [
  4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32  // E, G, I, K, M, O, Q, S, U, W, Y, AA, AC, AE, AG
] as const;