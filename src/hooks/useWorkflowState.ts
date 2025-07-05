/**
 * Hook centralisé pour la gestion d'état du workflow
 */

import { useState, useCallback } from 'react';
import { WorkflowState, WorkflowStep, WorkflowData } from '@/types/workflow';
import { Client } from '@/services/types';

const initialWorkflowData: WorkflowData = {
  selectedClient: null,
  isAuthenticated: false,
  connectedSheetId: null,
  sheetData: null,
  extractedCampaigns: []
};

const initialWorkflowState: WorkflowState = {
  currentStep: 'client',
  completed: new Set(),
  data: initialWorkflowData
};

export const useWorkflowState = () => {
  const [workflowState, setWorkflowState] = useState<WorkflowState>(initialWorkflowState);

  const updateWorkflowData = useCallback((updates: Partial<WorkflowData>) => {
    setWorkflowState(prev => ({
      ...prev,
      data: { ...prev.data, ...updates }
    }));
  }, []);

  const completeStep = useCallback((step: WorkflowStep) => {
    setWorkflowState(prev => ({
      ...prev,
      completed: new Set([...prev.completed, step])
    }));
  }, []);

  const setCurrentStep = useCallback((step: WorkflowStep) => {
    setWorkflowState(prev => ({
      ...prev,
      currentStep: step
    }));
  }, []);

  const moveToNextStep = useCallback(() => {
    const steps: WorkflowStep[] = ['client', 'auth', 'connect', 'extract', 'generate'];
    const currentIndex = steps.indexOf(workflowState.currentStep);
    
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      completeStep(workflowState.currentStep);
      setCurrentStep(nextStep);
    }
  }, [workflowState.currentStep, completeStep, setCurrentStep]);

  const resetWorkflow = useCallback(() => {
    setWorkflowState(initialWorkflowState);
  }, []);

  const setClientAndProgress = useCallback((client: Client) => {
    updateWorkflowData({ selectedClient: client });
    moveToNextStep();
  }, [updateWorkflowData, moveToNextStep]);

  const setAuthAndProgress = useCallback(() => {
    updateWorkflowData({ isAuthenticated: true });
    moveToNextStep();
  }, [updateWorkflowData, moveToNextStep]);

  const setSheetAndProgress = useCallback((sheetId: string, sheetData: any) => {
    updateWorkflowData({ 
      connectedSheetId: sheetId, 
      sheetData 
    });
    moveToNextStep();
  }, [updateWorkflowData, moveToNextStep]);

  const setCampaignsAndProgress = useCallback((campaigns: any[]) => {
    updateWorkflowData({ extractedCampaigns: campaigns });
    moveToNextStep();
  }, [updateWorkflowData, moveToNextStep]);

  return {
    workflowState,
    updateWorkflowData,
    completeStep,
    setCurrentStep,
    moveToNextStep,
    resetWorkflow,
    setClientAndProgress,
    setAuthAndProgress,
    setSheetAndProgress,
    setCampaignsAndProgress
  };
};