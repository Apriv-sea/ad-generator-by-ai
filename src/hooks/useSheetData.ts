
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
    
    console.log("🔍 HOOK - Tentative de chargement des données pour la feuille:", sheet.id);
    console.log("🔍 HOOK - Type de feuille:", sheet.id.startsWith('sheet_') ? 'LOCAL' : 'GOOGLE_SHEETS');
    setIsLoading(true);
    
    try {
      // Pour les feuilles locales, récupérer depuis le localStorage
      if (sheet.id.startsWith('sheet_')) {
        console.log("📁 HOOK - Traitement feuille locale");
        const storedData = localStorage.getItem(`sheet_data_${sheet.id}`);
        if (storedData) {
          const data = JSON.parse(storedData);
          console.log("📁 HOOK - Données locales trouvées:", {
            hasValues: !!data.values,
            valuesLength: data.values?.length || 0,
            firstRow: data.values?.[0],
            allData: data.values
          });
          setSheetData(data.values || []);
          toast.success("Données chargées depuis le stockage local");
        } else {
          console.log("📁 HOOK - Aucune donnée locale trouvée");
          setSheetData([]);
          toast.info("Aucune donnée trouvée pour cette feuille locale");
        }
        return;
      }

      // Pour les feuilles Google Sheets, utiliser le service
      console.log("📊 HOOK - Traitement feuille Google Sheets, appel du service...");
      
      const data = await googleSheetsService.getSheetData(sheet.id);
      
      console.log("📊 HOOK - Données reçues du service Google Sheets:", {
        hasData: !!data,
        hasValues: !!data?.values,
        valuesIsArray: Array.isArray(data?.values),
        valuesLength: data?.values?.length || 0,
        title: data?.title,
        firstRow: data?.values?.[0],
        secondRow: data?.values?.[1],
        allRows: data?.values,
        completeData: data
      });
      
      if (data && data.values && Array.isArray(data.values) && data.values.length > 0) {
        console.log(`📊 HOOK - Données valides détectées:`, {
          totalRows: data.values.length,
          firstRow: data.values[0],
          hasMultipleRows: data.values.length > 1,
          secondRow: data.values.length > 1 ? data.values[1] : null,
          allData: data.values
        });
        
        setSheetData(data.values);
        
        if (data.values.length === 1) {
          console.log("⚠️ HOOK - Seuls les en-têtes détectés");
          toast.warning(`Seuls les en-têtes ont été trouvés. Vérifiez que votre feuille contient des données.`);
        } else {
          console.log(`✅ HOOK - ${data.values.length - 1} lignes de données détectées`);
          toast.success(`Données chargées avec succès (${data.values.length} lignes dont ${data.values.length - 1} lignes de données)`);
        }
      } else {
        console.log("❌ HOOK - Aucune donnée valide trouvée:", {
          hasData: !!data,
          hasValues: !!data?.values,
          valuesIsArray: Array.isArray(data?.values),
          valuesLength: data?.values?.length || 0,
          rawData: data
        });
        toast.error("Aucune donnée trouvée dans la feuille. Vérifiez que votre feuille contient des données.");
        setSheetData([]);
      }
      
    } catch (error) {
      console.error("❌ HOOK - Erreur lors du chargement des données:", {
        error: error,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      });
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
