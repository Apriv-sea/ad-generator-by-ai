/**
 * Types TypeScript stricts pour remplacer les `any`
 * Améliore la type safety et la maintenabilité
 */

// === TYPES DE DONNÉES SHEET ===
export interface SheetData {
  values: string[][];
  range?: string;
  majorDimension?: 'ROWS' | 'COLUMNS';
}

export interface SheetMetadata {
  id: string;
  name: string;
  url?: string;
  lastModified?: string;
  rowCount?: number;
  columnCount?: number;
}

export interface SheetRow {
  [columnIndex: number]: string;
  campaign?: string;
  adGroup?: string;
  keywords?: string;
  [key: string]: string | undefined;
}

// === TYPES DE CAMPAGNES ===
export interface CampaignData {
  id?: string;
  name: string;
  context: string;
  adGroups: AdGroupData[];
  clientId?: string;
  status?: 'draft' | 'active' | 'paused';
  createdAt?: string;
  updatedAt?: string;
}

export interface AdGroupData {
  id?: string;
  name: string;
  keywords: string[];
  context: string;
  campaignId?: string;
  generatedContent?: GeneratedContent[];
}

export interface GeneratedContent {
  id?: string;
  titles: string[];
  descriptions: string[];
  provider: string;
  model: string;
  tokensUsed?: number;
  generatedAt: string;
}

// === TYPES D'HISTORIQUE ===
export interface HistoryItem {
  id: string;
  type: 'generation' | 'backup' | 'restore';
  timestamp: string;
  provider: string;
  model?: string;
  metadata: HistoryMetadata;
}

export interface HistoryMetadata {
  campaignName?: string;
  adGroupName?: string;
  rowIndex?: number;
  tokensUsed?: number;
  success: boolean;
  error?: string;
}

export interface BackupData {
  id: string;
  timestamp: string;
  sheetData: SheetData;
  campaigns: CampaignData[];
  metadata: BackupMetadata;
}

export interface BackupMetadata {
  version: string;
  userAgent: string;
  size: number;
  compressed?: boolean;
}

// === TYPES D'ERREURS ===
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  userId?: string;
  context?: string;
}

export interface ValidationError extends AppError {
  field: string;
  value: unknown;
  rule: string;
}

export interface APIError extends AppError {
  status: number;
  endpoint: string;
  method: string;
  provider?: string;
}

// === TYPES DE WORKFLOW ===
export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  data?: Record<string, unknown>;
  error?: string;
}

export interface WorkflowState {
  currentStep: number;
  steps: WorkflowStep[];
  data: WorkflowData;
  isComplete: boolean;
  hasError: boolean;
}

export interface WorkflowData {
  connectedSheetId?: string;
  sheetData?: SheetData;
  extractedCampaigns?: CampaignData[];
  selectedModel?: string;
  generationResults?: GeneratedContent[];
}

// === TYPES DE COMPOSANTS ===
export interface TableData {
  headers: string[];
  rows: TableRow[];
  totalRows: number;
  currentPage: number;
  pageSize: number;
}

export interface TableRow {
  id: string;
  cells: TableCell[];
  metadata?: Record<string, unknown>;
}

export interface TableCell {
  value: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  editable?: boolean;
  error?: string;
}

// === TYPES DE FORMULAIRES ===
export interface FormField<T = string> {
  name: string;
  value: T;
  error?: string;
  touched: boolean;
  required?: boolean;
  disabled?: boolean;
}

export interface FormState<T extends Record<string, unknown>> {
  fields: { [K in keyof T]: FormField<T[K]> };
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  errors: Record<keyof T, string | undefined>;
}

// === TYPES D'ÉVÉNEMENTS ===
export interface UserEvent {
  type: string;
  timestamp: string;
  userId: string;
  data: Record<string, unknown>;
  sessionId?: string;
}

export interface AnalyticsEvent extends UserEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

// === TYPES UTILITAIRES ===
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<{ data: T; error: null } | { data: null; error: AppError }>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SearchParams {
  query?: string;
  filters?: Record<string, unknown>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  page?: number;
  pageSize?: number;
}