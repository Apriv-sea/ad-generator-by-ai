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

      // Pour les feuilles Google Sheets, utiliser le service avec range étendu
      console.log("📊 HOOK - Traitement feuille Google Sheets, appel du service...");
      
      // Essayer d'abord avec une plage plus large pour capturer toutes les données
      const ranges = ['A:Z', 'A1:Z1000', 'Sheet1!A:Z', 'A1:AZ1000'];
      let data = null;
      let successRange = null;
      
      for (const range of ranges) {
        try {
          console.log(`📊 HOOK - Tentative avec la plage: ${range}`);
          data = await googleSheetsService.getSheetData(sheet.id, range);
          
          if (data && data.values && data.values.length > 0) {
            successRange = range;
            console.log(`✅ HOOK - Succès avec la plage ${range}, ${data.values.length} lignes trouvées`);
            break;
          }
        } catch (rangeError) {
          console.log(`⚠️ HOOK - Échec avec la plage ${range}:`, rangeError.message);
          continue;
        }
      }
      
      console.log("📊 HOOK - Données reçues du service Google Sheets:", {
        hasData: !!data,
        hasValues: !!data?.values,
        valuesIsArray: Array.isArray(data?.values),
        valuesLength: data?.values?.length || 0,
        title: data?.title,
        successRange: successRange,
        rawDataSample: data?.values?.slice(0, 5),
        allRows: data?.values,
        completeData: data
      });
      
      if (data && data.values && Array.isArray(data.values) && data.values.length > 0) {
        console.log(`📊 HOOK - Données valides détectées:`, {
          totalRows: data.values.length,
          expectedRows: 7, // Selon votre screenshot
          firstRow: data.values[0],
          hasMultipleRows: data.values.length > 1,
          allRowsDetails: data.values.map((row, index) => ({
            rowIndex: index,
            rowLength: row?.length || 0,
            rowContent: row?.slice(0, 5), // Première 5 colonnes seulement
            isEmpty: !row || row.every(cell => !cell || cell.toString().trim() === '')
          })),
          nonEmptyRows: data.values.filter(row => row && row.some(cell => cell && cell.toString().trim() !== '')).length
        });
        
        // Filtrer les lignes complètement vides
        const nonEmptyRows = data.values.filter(row => 
          row && row.some(cell => cell && cell.toString().trim() !== '')
        );
        
        console.log(`📊 HOOK - Après filtrage des lignes vides: ${nonEmptyRows.length} lignes`);
        
        setSheetData(nonEmptyRows);
        
        if (nonEmptyRows.length === 1) {
          console.log("⚠️ HOOK - Seuls les en-têtes détectés");
          toast.warning(`Seuls les en-têtes ont été trouvés. Vérifiez que votre feuille contient des données.`);
        } else if (nonEmptyRows.length < 7) {
          console.log(`⚠️ HOOK - Moins de lignes que prévu détectées: ${nonEmptyRows.length} au lieu de 7`);
          toast.warning(`${nonEmptyRows.length} lignes chargées (${nonEmptyRows.length - 1} lignes de données). Attendu: 7 lignes selon votre feuille.`);
        } else {
          console.log(`✅ HOOK - ${nonEmptyRows.length - 1} lignes de données détectées`);
          toast.success(`Données chargées avec succès (${nonEmptyRows.length} lignes dont ${nonEmptyRows.length - 1} lignes de données)`);
        }
      } else {
        console.log("❌ HOOK - Aucune donnée valide trouvée:", {
          hasData: !!data,
          hasValues: !!data?.values,
          valuesIsArray: Array.isArray(data?.values),
          valuesLength: data?.values?.length || 0,
          rawData: data
        });
        toast.error("Aucune donnée trouvée dans la feuille. Vérifiez que votre feuille contient des données et qu'elle est accessible.");
        setSheetData([]);
      }
      
    } catch (error) {
      console.error("❌ HOOK - Erreur lors du chargement des données:", {
        error: error,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error.constructor?.name
      });
      
      // Message d'erreur plus détaillé
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      if (errorMessage.includes('401')) {
        toast.error("Erreur d'authentification Google Sheets. Veuillez vous reconnecter.");
      } else if (errorMessage.includes('403')) {
        toast.error("Accès refusé à la feuille Google Sheets. Vérifiez les permissions.");
      } else if (errorMessage.includes('404')) {
        toast.error("Feuille Google Sheets introuvable. Vérifiez l'ID de la feuille.");
      } else {
        toast.error(`Impossible de charger les données: ${errorMessage}`);
      }
      
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
