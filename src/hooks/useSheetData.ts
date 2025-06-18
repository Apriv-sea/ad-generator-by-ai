
import { useState, useEffect } from "react";
import { Sheet, Client, sheetService } from "@/services/googleSheetsService";
import { getClientInfo } from "@/services/clientService";
import { toast } from "sonner";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

export function useSheetData(sheet: Sheet | null) {
  const [clientInfo, setClientInfo] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sheetData, setSheetData] = useState<any[][] | null>(null);
  
  const { isAuthenticated, getAccessToken } = useGoogleAuth();

  useEffect(() => {
    if (sheet) {
      loadInitialData();
      loadClientInfo();
    }
  }, [sheet, isAuthenticated]);

  const loadInitialData = async () => {
    if (!sheet) return;
    
    console.log("🔍 Tentative de chargement des données pour la feuille:", sheet.id);
    setIsLoading(true);
    
    try {
      // Vérifier l'authentification Google
      if (!isAuthenticated) {
        console.log("❌ Utilisateur non authentifié avec Google");
        toast.error("Veuillez vous connecter à Google Sheets dans l'onglet 'Google Sheets'");
        setSheetData([]);
        return;
      }

      // Obtenir un token d'accès valide
      const accessToken = await getAccessToken();
      if (!accessToken) {
        console.log("❌ Impossible d'obtenir un token d'accès valide");
        toast.error("Session Google expirée. Veuillez vous reconnecter.");
        setSheetData([]);
        return;
      }

      console.log("✅ Token d'accès Google valide obtenu, récupération des données...");
      
      // Essayer plusieurs noms d'onglets possibles
      const possibleSheetNames = [
        'Campagnes publicitaires',
        'Campagnes',
        'Sheet1',
        'Feuil1',
        'Campaign',
        'Campaigns'
      ];

      let data = null;
      let usedSheetName = '';

      for (const sheetName of possibleSheetNames) {
        try {
          console.log(`🔍 Tentative avec l'onglet: "${sheetName}"`);
          
          const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheet.id}/values/${encodeURIComponent(sheetName)}!A1:Z1000`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }
          );

          if (response.ok) {
            const result = await response.json();
            if (result.values && result.values.length > 0) {
              data = result;
              usedSheetName = sheetName;
              console.log(`✅ Données trouvées dans l'onglet "${sheetName}":`, result.values.length, "lignes");
              break;
            }
          } else if (response.status === 401) {
            console.log("❌ Token expiré, tentative de rafraîchissement...");
            // Le hook useGoogleAuth gère automatiquement le rafraîchissement
            toast.error("Session expirée. Veuillez actualiser la page.");
            setSheetData([]);
            return;
          } else {
            console.log(`❌ Échec pour l'onglet "${sheetName}":`, response.status);
          }
        } catch (error) {
          console.log(`❌ Erreur pour l'onglet "${sheetName}":`, error);
          continue;
        }
      }

      if (data && data.values && data.values.length > 0) {
        console.log(`📊 Données chargées depuis l'onglet "${usedSheetName}":`, {
          totalRows: data.values.length,
          firstRow: data.values[0],
          sampleData: data.values.slice(0, 3)
        });
        
        setSheetData(data.values);
        toast.success(`Données chargées avec succès depuis l'onglet "${usedSheetName}" (${data.values.length} lignes)`);
      } else {
        console.log("❌ Aucune donnée trouvée dans aucun onglet");
        toast.error("Aucune donnée trouvée dans la feuille. Vérifiez que votre feuille contient des données et que les onglets sont nommés correctement.");
        setSheetData([]);
      }
      
    } catch (error) {
      console.error("❌ Erreur lors du chargement des données:", error);
      
      if (error.message?.includes('401') || error.message?.includes('403')) {
        toast.error("Erreur d'authentification. Veuillez vous reconnecter à Google Sheets.");
      } else {
        toast.error("Impossible de charger les données de la feuille. Vérifiez que la feuille est accessible et contient des données.");
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

      // Priorité 3: Informations client dans l'onglet Google Sheets
      if (!client) {
        console.log("Tentative de récupération depuis l'onglet Google Sheets");
        client = await sheetService.getClientInfo(sheet.id);
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
