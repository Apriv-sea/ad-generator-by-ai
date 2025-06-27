
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { unifiedGoogleSheetsService, GoogleSheetsData } from '@/services/googlesheets/unifiedGoogleSheetsService';
import { toast } from 'sonner';

interface GoogleSheetsContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentSheetId: string | null;
  currentSheetData: GoogleSheetsData | null;
  error: string | null;
  
  // Actions
  initiateAuth: () => Promise<string>;
  completeAuth: (code: string) => Promise<void>;
  connectToSheet: (sheetId: string) => Promise<void>;
  saveSheetData: (data: string[][]) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const GoogleSheetsContext = createContext<GoogleSheetsContextType | undefined>(undefined);

interface GoogleSheetsProviderProps {
  children: ReactNode;
}

export const GoogleSheetsProvider: React.FC<GoogleSheetsProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);
  const [currentSheetData, setCurrentSheetData] = useState<GoogleSheetsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authenticated = unifiedGoogleSheetsService.isAuthenticated();
    console.log('État d\'authentification initial:', authenticated);
    setIsAuthenticated(authenticated);
  }, []);

  const initiateAuth = async (): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Initiation de l\'authentification Google Sheets...');
      const authUrl = await unifiedGoogleSheetsService.initiateAuth();
      console.log('URL d\'authentification générée:', authUrl);
      return authUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur d\'authentification';
      console.error('Erreur lors de l\'initiation de l\'authentification:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const completeAuth = async (code: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Completion de l\'authentification avec le code:', code);
      await unifiedGoogleSheetsService.completeAuth(code);
      
      // Vérifier l'état d'authentification après completion
      const authenticated = unifiedGoogleSheetsService.isAuthenticated();
      console.log('État d\'authentification après completion:', authenticated);
      
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        console.log('Authentification Google Sheets réussie !');
        toast.success('Authentification Google Sheets réussie !');
      } else {
        throw new Error('Échec de l\'authentification - token non valide');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'authentification';
      console.error('Erreur lors de la completion de l\'authentification:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const connectToSheet = async (sheetId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Connexion à la feuille:', sheetId);
      const data = await unifiedGoogleSheetsService.getSheetData(sheetId);
      setCurrentSheetId(sheetId);
      setCurrentSheetData(data);
      console.log('Connexion à la feuille réussie !');
      toast.success('Connexion à la feuille réussie !');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion à la feuille';
      console.error('Erreur de connexion:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const saveSheetData = async (data: string[][]): Promise<boolean> => {
    if (!currentSheetId) {
      throw new Error('Aucune feuille connectée');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const success = await unifiedGoogleSheetsService.saveSheetData(currentSheetId, data);
      if (success) {
        // Mettre à jour les données locales
        setCurrentSheetData(prev => prev ? { ...prev, values: data } : null);
        toast.success('Données sauvegardées avec succès !');
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de sauvegarde';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    console.log('Déconnexion Google Sheets');
    unifiedGoogleSheetsService.logout();
    setIsAuthenticated(false);
    setCurrentSheetId(null);
    setCurrentSheetData(null);
    setError(null);
    toast.info('Déconnecté de Google Sheets');
  };

  const clearError = (): void => {
    setError(null);
  };

  const value: GoogleSheetsContextType = {
    isAuthenticated,
    isLoading,
    currentSheetId,
    currentSheetData,
    error,
    
    initiateAuth,
    completeAuth,
    connectToSheet,
    saveSheetData,
    logout,
    clearError
  };

  return (
    <GoogleSheetsContext.Provider value={value}>
      {children}
    </GoogleSheetsContext.Provider>
  );
};

export const useGoogleSheets = (): GoogleSheetsContextType => {
  const context = useContext(GoogleSheetsContext);
  if (context === undefined) {
    throw new Error('useGoogleSheets must be used within a GoogleSheetsProvider');
  }
  return context;
};
