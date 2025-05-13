
import { useState, useEffect } from "react";
import { Sheet, Client, sheetService } from "@/services/googleSheetsService";
import { toast } from "sonner";

export function useSheetData(sheet: Sheet | null) {
  const [clientInfo, setClientInfo] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sheetData, setSheetData] = useState<any[][] | null>(null);

  useEffect(() => {
    if (sheet) {
      loadInitialData();
      loadClientInfo();
    }
  }, [sheet]);

  const loadInitialData = async () => {
    if (!sheet) return;
    
    setIsLoading(true);
    try {
      // Charger les données existantes de la feuille
      const data = await sheetService.getSheetData(sheet.id);
      if (data && data.values && data.values.length > 0) {
        setSheetData(data.values);
      } else {
        // Initialiser avec des données vides
        setSheetData([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Impossible de charger les données de la feuille");
      setSheetData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClientInfo = async () => {
    if (!sheet) return;
    
    try {
      const client = await sheetService.getClientInfo(sheet.id);
      setClientInfo(client);
    } catch (error) {
      console.error("Erreur lors du chargement des informations client:", error);
    }
  };

  return {
    clientInfo,
    isLoading,
    sheetData,
    setSheetData
  };
}
