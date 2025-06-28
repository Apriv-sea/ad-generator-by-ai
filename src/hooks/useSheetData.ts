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
    
    console.log("🔍 === DEBUT CHARGEMENT OPTIMISE ===");
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

      // Pour les feuilles Google Sheets, utiliser le service amélioré
      console.log("📊 HOOK - Traitement feuille Google Sheets, appel du service...");
      
      // Utiliser une plage plus large pour capturer toutes les données
      const data = await googleSheetsService.getSheetData(sheet.id, 'A1:AZ1000');
      
      console.log("📊 HOOK - Données brutes reçues du service:", {
        hasData: !!data,
        hasValues: !!data?.values,
        valuesIsArray: Array.isArray(data?.values),
        valuesLength: data?.values?.length || 0,
        title: data?.title,
        range: data?.range,
        rangeUsed: data?.rangeUsed,
        firstRow: data?.values?.[0],
        sampleRows: data?.values?.slice(0, 3)
      });
      
      if (data && data.values && Array.isArray(data.values)) {
        console.log(`📊 HOOK - Analyse détaillée des ${data.values.length} lignes reçues:`);
        
        // Analyser chaque ligne pour diagnostiquer
        const lineAnalysis = data.values.map((row, index) => {
          const rowArray = Array.isArray(row) ? row : [];
          const hasContent = rowArray.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
          return {
            index,
            length: rowArray.length,
            hasContent,
            content: rowArray.slice(0, 5), // Première 5 colonnes pour debug
            fullRow: rowArray
          };
        });
        
        console.log("📋 Analyse ligne par ligne:", lineAnalysis);
        
        // Filtrage plus intelligent des lignes vides
        const processedRows = data.values.filter((row, index) => {
          const rowArray = Array.isArray(row) ? row : [];
          const hasContent = rowArray.some(cell => 
            cell !== null && 
            cell !== undefined && 
            String(cell).trim() !== ''
          );
          
          // Garder la première ligne (headers) même si elle semble vide
          if (index === 0) {
            console.log(`📋 Ligne ${index + 1} (headers) conservée:`, rowArray);
            return true;
          }
          
          if (hasContent) {
            console.log(`📋 Ligne ${index + 1} conservée (contenu détecté):`, rowArray);
            return true;
          } else {
            console.log(`📋 Ligne ${index + 1} filtrée (vide):`, rowArray);
            return false;
          }
        });
        
        console.log(`📊 HOOK - Après filtrage intelligent: ${processedRows.length} lignes sur ${data.values.length} originales`);
        
        setSheetData(processedRows);
        
        // Messages d'information plus précis
        if (processedRows.length === 0) {
          console.log("❌ HOOK - Aucune donnée après filtrage");
          toast.error("Aucune donnée trouvée dans la feuille. La feuille semble vide.");
        } else if (processedRows.length === 1) {
          console.log("⚠️ HOOK - Seuls les en-têtes détectés");
          toast.warning("Seuls les en-têtes ont été trouvés. Ajoutez des données dans votre feuille Google Sheets.");
        } else {
          const dataRowsCount = processedRows.length - 1;
          console.log(`✅ HOOK - ${dataRowsCount} lignes de données détectées sur ${data.values.length} lignes totales`);
          
          if (data.values.length > processedRows.length) {
            toast.success(`${dataRowsCount} lignes de données chargées (${data.values.length - processedRows.length} lignes vides filtrées)`);
          } else {
            toast.success(`${dataRowsCount} lignes de données chargées avec succès`);
          }
          
          // Log détaillé des données finales
          console.log("📊 HOOK - Données finales par ligne:");
          processedRows.forEach((row, i) => {
            console.log(`  Ligne ${i + 1}:`, row);
          });
        }
      } else {
        console.log("❌ HOOK - Aucune donnée valide trouvée:", {
          hasData: !!data,
          hasValues: !!data?.values,
          valuesIsArray: Array.isArray(data?.values),
          rawData: data
        });
        toast.error("Impossible de récupérer les données de la feuille. Vérifiez que la feuille est accessible et contient des données.");
        setSheetData([]);
      }
      
    } catch (error) {
      console.error("❌ HOOK - Erreur lors du chargement:", {
        error: error,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Messages d'erreur spécifiques
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      if (errorMessage.includes('401') || errorMessage.includes('Authentification')) {
        toast.error("Erreur d'authentification Google Sheets. Reconnectez-vous.");
      } else if (errorMessage.includes('403') || errorMessage.includes('Accès refusé')) {
        toast.error("Accès refusé à la feuille. Vérifiez que la feuille est partagée ou que vous avez les permissions.");
      } else if (errorMessage.includes('404') || errorMessage.includes('introuvable')) {
        toast.error("Feuille introuvable. Vérifiez l'URL de la feuille Google Sheets.");
      } else {
        toast.error(`Impossible de charger les données: ${errorMessage}`);
      }
      
      setSheetData([]);
    } finally {
      setIsLoading(false);
      console.log("🔍 === FIN CHARGEMENT ===");
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
