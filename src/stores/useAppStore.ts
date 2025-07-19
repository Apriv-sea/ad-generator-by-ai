import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ThemeState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
}

interface CampaignState {
  selectedSheet: any | null;
  selectedClient: any | null;
  extractedCampaigns: any[];
  campaignContexts: Record<string, string>;
  setSelectedSheet: (sheet: any) => void;
  setSelectedClient: (client: any) => void;
  setExtractedCampaigns: (campaigns: any[]) => void;
  setCampaignContexts: (contexts: Record<string, string>) => void;
}

interface UIState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  loading: {
    campaigns: boolean;
    sheets: boolean;
    generation: boolean;
  };
  setLoading: (key: keyof UIState['loading'], value: boolean) => void;
}

type AppStore = ThemeState & CampaignState & UIState;

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Theme State
      isDarkMode: false,
      toggleDarkMode: () => {
        const newMode = !get().isDarkMode;
        set({ isDarkMode: newMode });
        // Apply to document
        if (newMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      setDarkMode: (isDark: boolean) => {
        set({ isDarkMode: isDark });
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      // Campaign State
      selectedSheet: null,
      selectedClient: null,
      extractedCampaigns: [],
      campaignContexts: {},
      setSelectedSheet: (sheet) => set({ selectedSheet: sheet }),
      setSelectedClient: (client) => set({ selectedClient: client }),
      setExtractedCampaigns: (campaigns) => set({ extractedCampaigns: campaigns }),
      setCampaignContexts: (contexts) => set({ campaignContexts: contexts }),

      // UI State
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      loading: {
        campaigns: false,
        sheets: false,
        generation: false,
      },
      setLoading: (key, value) => set((state) => ({
        loading: { ...state.loading, [key]: value }
      })),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        sidebarCollapsed: state.sidebarCollapsed,
        campaignContexts: state.campaignContexts,
      }),
    }
  )
);

// Initialize theme on load
if (typeof window !== 'undefined') {
  const { isDarkMode } = useAppStore.getState();
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  }
}