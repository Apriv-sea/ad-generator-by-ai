
import { useState, useEffect } from "react";
import { Sheet, Client } from "@/services/types";
import { getClientInfo } from "@/services/clientService";
import { toast } from "sonner";
import { googleSheetsService } from "@/services/googlesheets/googleSheetsService";

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
    
    console.log("🔍 Tentative de chargement des données pour la feuille:", sheet.id);
    setIsLoading(true);
    
    try {
      // Pour les feuilles locales, récupérer depuis le localStorage
      if (sheet.id.startsWith('sheet_')) {
        const storedData = localStorage.getItem(`sheet_data_${sheet.id}`);
        if (storedData) {
          const data = JSON.parse(storedData);
          setSheetData(data.values || []);
          toast.success("Données chargées depuis le stockage local");
        } else {
          setSheetData([]);
          toast.info("Aucune donnée trouvée pour cette feuille locale");
        }
        return;
      }

      // Pour les feuilles Google Sheets, utiliser le service
      console.log("✅ Récupération des données via Google Sheets...");
      
      const data = await googleSheetsService.getSheetData(sheet.id);
      
      if (data && data.values && data.values.length > 0) {
        console.log(`📊 Données chargées:`, {
          totalRows: data.values.length,
          firstRow: data.values[0],
          sampleData: data.values.slice(0, 3)
        });
        
        setSheetData(data.values);
        toast.success(`Données chargées avec succès (${data.values.length} lignes)`);
      } else {
        console.log("❌ Aucune donnée trouvée dans la feuille");
        toast.error("Aucune donnée trouvée dans la feuille. Vérifiez que votre feuille contient des données.");
        setSheetData([]);
      }
      
    } catch (error) {
      console.error("❌ Erreur lors du chargement des données:", error);
      toast.error("Impossible de charger les données de la feuille.");
      setSheetData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClientInfo = async () => {
    if (!sheet) return;
    
    try {
      let client: Client | null = null;

      // Priorité 1: Client ID dans la feuille (nouvelles feuilles avec client sélectionné)
      if (sheet.clientId) {
        console.log("Chargement du client depuis sheet.clientId:", sheet.clientId);
        client = await getClientInfo(sheet.clientId);
      }

      // Priorité 2: Contexte client direct dans la feuille (legacy)
      if (!client && sheet.clientContext) {
        console.log("Utilisation du contexte client legacy:", sheet.clientContext);
        client = {
          id: '',
          name: 'Client (contexte legacy)',
          businessContext: sheet.clientContext
        };
      }

      if (client) {
        console.log("Client trouvé:", client);
        setClientInfo(client);
      } else {
        console.log("Aucun client trouvé pour cette feuille");
        setClientInfo(null);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des informations client:", error);
      setClientInfo(null);
    }
  };

  return {
    clientInfo,
    isLoading,
    sheetData,
    setSheetData,
    refreshData: loadInitialData
  };
}
