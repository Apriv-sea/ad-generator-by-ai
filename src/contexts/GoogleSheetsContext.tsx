
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
    setIsAuthenticated(unifiedGoogleSheetsService.isAuthenticated());
  }, []);

  const initiateAuth = async (): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const authUrl = await unifiedGoogleSheetsService.initiateAuth();
      return authUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur d\'authentification';
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
      await unifiedGoogleSheetsService.completeAuth(code);
      setIsAuthenticated(true);
      toast.success('Authentification réussie !');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'authentification';
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
      const data = await unifiedGoogleSheetsService.getSheetData(sheetId);
      setCurrentSheetId(sheetId);
      setCurrentSheetData(data);
      toast.success('Connexion à la feuille réussie !');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion à la feuille';
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
    unifiedGoogleSheetsService.logout();
    setIsAuthenticated(false);
    setCurrentSheetId(null);
    setCurrentSheetData(null);
    setError(null);
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
