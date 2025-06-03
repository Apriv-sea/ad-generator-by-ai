
import { useState, useEffect, useCallback, useMemo } from "react";
import { Sheet, Client, sheetService } from "@/services/googleSheetsService";
import { toast } from "sonner";

export function useOptimizedSheetData(sheet: Sheet | null) {
  const [clientInfo, setClientInfo] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sheetData, setSheetData] = useState<any[][] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mémoriser les données pour éviter les re-renders inutiles
  const memoizedSheetData = useMemo(() => sheetData, [sheetData]);
  const memoizedClientInfo = useMemo(() => clientInfo, [clientInfo]);

  const loadInitialData = useCallback(async () => {
    if (!sheet) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await sheetService.getSheetData(sheet.id);
      if (data && data.values && data.values.length > 0) {
        setSheetData(data.values);
      } else {
        setSheetData([]);
      }
    } catch (error) {
      const errorMessage = "Impossible de charger les données de la feuille";
      console.error("Erreur lors du chargement des données:", error);
      setError(errorMessage);
      toast.error(errorMessage);
      setSheetData([]);
    } finally {
      setIsLoading(false);
    }
  }, [sheet]);

  const loadClientInfo = useCallback(async () => {
    if (!sheet) return;
    
    try {
      const client = await sheetService.getClientInfo(sheet.id);
      setClientInfo(client);
    } catch (error) {
      console.error("Erreur lors du chargement des informations client:", error);
      setError("Impossible de charger les informations client");
    }
  }, [sheet]);

  const refreshData = useCallback(() => {
    loadInitialData();
    loadClientInfo();
  }, [loadInitialData, loadClientInfo]);

  useEffect(() => {
    if (sheet) {
      refreshData();
    }
  }, [sheet, refreshData]);

  return {
    clientInfo: memoizedClientInfo,
    isLoading,
    sheetData: memoizedSheetData,
    setSheetData,
    error,
    refreshData
  };
}
