/**
 * Types TypeScript cohérents pour le workflow
 */

import { Client } from "@/services/types";

export type WorkflowStep = 'client' | 'auth' | 'connect' | 'extract' | 'generate';

export interface WorkflowState {
  currentStep: WorkflowStep;
  completed: Set<WorkflowStep>;
  data: WorkflowData;
}

export interface WorkflowData {
  selectedClient: Client | null;
  isAuthenticated: boolean;
  connectedSheetId: string | null;
  sheetData: WorkflowSheetData | null;
  extractedCampaigns: WorkflowCampaign[];
}

export interface WorkflowSheetData {
  values: string[][];
  title?: string;
  info?: any;
}

export interface WorkflowCampaign {
  id: string;
  campaignName: string;
  adGroupName: string;
  keywords: string;
  clientId?: string;
}

export interface WorkflowStepConfig {
  id: WorkflowStep;
  title: string;
  description: string;
  icon: any;
  color: string;
  isComplete: boolean;
  isCurrent: boolean;
}