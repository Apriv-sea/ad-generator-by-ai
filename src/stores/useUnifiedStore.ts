// Store Zustand unifié - Single source of truth pour toute l'application
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

// Types pour le store unifié
interface Project {
  id: string;
  name: string;
  status: 'draft' | 'importing' | 'ready' | 'generating' | 'completed' | 'error';
  clientId?: string;
  sheetsData?: any[];
  titlesCount: number;
  descriptionsCount: number;
  estimatedCost: number;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  id: string;
  name: string;
  description: string;
  industry: string;
  context?: string;
  createdAt: string;
  updatedAt: string;
}

interface Settings {
  apiKeys: {
    openai?: string;
    anthropic?: string;
    google?: string;
  };
  preferences: {
    defaultModel: string;
    language: string;
    theme: 'light' | 'dark' | 'system';
  };
}

interface WorkflowState {
  currentStep: number;
  totalSteps: number;
  isProcessing: boolean;
  errors: string[];
  progress: number;
}

interface UnifiedState {
  // Data
  projects: Project[];
  clients: Client[];
  settings: Settings;
  workflow: WorkflowState;
  
  // Loading states
  isLoading: {
    projects: boolean;
    clients: boolean;
    generation: boolean;
  };
  
  // Error states
  errors: {
    projects: string | null;
    clients: string | null;
    generation: string | null;
    global: string | null;
  };
  
  // Actions pour Projects
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setProjectsLoading: (loading: boolean) => void;
  setProjectsError: (error: string | null) => void;
  
  // Actions pour Clients
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  setClientsLoading: (loading: boolean) => void;
  setClientsError: (error: string | null) => void;
  
  // Actions pour Settings
  updateSettings: (updates: Partial<Settings>) => void;
  updateApiKey: (provider: keyof Settings['apiKeys'], key: string) => void;
  
  // Actions pour Workflow
  setWorkflowStep: (step: number) => void;
  setWorkflowProcessing: (processing: boolean) => void;
  addWorkflowError: (error: string) => void;
  clearWorkflowErrors: () => void;
  setWorkflowProgress: (progress: number) => void;
  
  // Actions globales
  clearAllErrors: () => void;
  resetStore: () => void;
}

const initialSettings: Settings = {
  apiKeys: {},
  preferences: {
    defaultModel: 'gpt-4',
    language: 'fr',
    theme: 'system'
  }
};

const initialWorkflow: WorkflowState = {
  currentStep: 0,
  totalSteps: 3,
  isProcessing: false,
  errors: [],
  progress: 0
};

export const useUnifiedStore = create<UnifiedState>()(
  devtools(
    persist(
      (set, get) => ({
        // État initial
        projects: [],
        clients: [],
        settings: initialSettings,
        workflow: initialWorkflow,
        
        isLoading: {
          projects: false,
          clients: false,
          generation: false,
        },
        
        errors: {
          projects: null,
          clients: null,
          generation: null,
          global: null,
        },

        // Actions Projects
        addProject: (projectData) => {
          const now = new Date().toISOString();
          const newProject: Project = {
            ...projectData,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
          };
          
          set((state) => ({
            projects: [...state.projects, newProject],
            errors: { ...state.errors, projects: null }
          }));
        },

        updateProject: (id, updates) => {
          const now = new Date().toISOString();
          set((state) => ({
            projects: state.projects.map(project =>
              project.id === id
                ? { ...project, ...updates, updatedAt: now }
                : project
            ),
            errors: { ...state.errors, projects: null }
          }));
        },

        deleteProject: (id) => {
          set((state) => ({
            projects: state.projects.filter(project => project.id !== id),
            errors: { ...state.errors, projects: null }
          }));
        },

        setProjectsLoading: (loading) => {
          set((state) => ({
            isLoading: { ...state.isLoading, projects: loading }
          }));
        },

        setProjectsError: (error) => {
          set((state) => ({
            errors: { ...state.errors, projects: error }
          }));
        },

        // Actions Clients
        addClient: (clientData) => {
          const now = new Date().toISOString();
          const newClient: Client = {
            ...clientData,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
          };
          
          set((state) => ({
            clients: [...state.clients, newClient],
            errors: { ...state.errors, clients: null }
          }));
        },

        updateClient: (id, updates) => {
          const now = new Date().toISOString();
          set((state) => ({
            clients: state.clients.map(client =>
              client.id === id
                ? { ...client, ...updates, updatedAt: now }
                : client
            ),
            errors: { ...state.errors, clients: null }
          }));
        },

        deleteClient: (id) => {
          set((state) => ({
            clients: state.clients.filter(client => client.id !== id),
            errors: { ...state.errors, clients: null }
          }));
        },

        setClientsLoading: (loading) => {
          set((state) => ({
            isLoading: { ...state.isLoading, clients: loading }
          }));
        },

        setClientsError: (error) => {
          set((state) => ({
            errors: { ...state.errors, clients: error }
          }));
        },

        // Actions Settings
        updateSettings: (updates) => {
          set((state) => ({
            settings: {
              ...state.settings,
              ...updates,
              apiKeys: { ...state.settings.apiKeys, ...updates.apiKeys },
              preferences: { ...state.settings.preferences, ...updates.preferences }
            }
          }));
        },

        updateApiKey: (provider, key) => {
          set((state) => ({
            settings: {
              ...state.settings,
              apiKeys: {
                ...state.settings.apiKeys,
                [provider]: key
              }
            }
          }));
        },

        // Actions Workflow
        setWorkflowStep: (step) => {
          set((state) => ({
            workflow: { ...state.workflow, currentStep: step }
          }));
        },

        setWorkflowProcessing: (processing) => {
          set((state) => ({
            workflow: { ...state.workflow, isProcessing: processing }
          }));
        },

        addWorkflowError: (error) => {
          set((state) => ({
            workflow: {
              ...state.workflow,
              errors: [...state.workflow.errors, error]
            }
          }));
        },

        clearWorkflowErrors: () => {
          set((state) => ({
            workflow: { ...state.workflow, errors: [] }
          }));
        },

        setWorkflowProgress: (progress) => {
          set((state) => ({
            workflow: { ...state.workflow, progress }
          }));
        },

        // Actions globales
        clearAllErrors: () => {
          set((state) => ({
            errors: {
              projects: null,
              clients: null,
              generation: null,
              global: null,
            },
            workflow: { ...state.workflow, errors: [] }
          }));
        },

        resetStore: () => {
          set({
            projects: [],
            clients: [],
            settings: initialSettings,
            workflow: initialWorkflow,
            isLoading: {
              projects: false,
              clients: false,
              generation: false,
            },
            errors: {
              projects: null,
              clients: null,
              generation: null,
              global: null,
            }
          });
        },
      }),
      {
        name: 'unified-store',
        partialize: (state) => ({
          projects: state.projects,
          clients: state.clients,
          settings: state.settings,
          // Ne pas persister les loading states et errors
        }),
      }
    ),
    {
      name: 'unified-store',
    }
  )
);