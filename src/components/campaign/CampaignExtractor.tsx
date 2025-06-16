
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, Campaign } from "@/services/googleSheetsService";
import { toast } from "sonner";
import CampaignTable from "./CampaignTable";
import { ArrowRight, AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
import { campaignExtractorService } from "@/services/storage/campaignExtractorService";

interface CampaignExtractorProps {
  sheet: Sheet;
  sheetData: any[][] | null;
  onUpdateComplete: () => void;
  refreshData?: () => void;
}

const CampaignExtractor: React.FC<CampaignExtractorProps> = ({ 
  sheet, 
  sheetData, 
  onUpdateComplete,
  refreshData
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExtracted, setIsExtracted] = useState(false);

  const extractCampaigns = async () => {
    if (!sheet) {
      toast.error("Aucune feuille sélectionnée");
      return;
    }

    setIsExtracting(true);
    try {
      console.log("🚀 Début de l'extraction des campagnes pour la feuille:", sheet.id);
      console.log("📋 Données disponibles:", sheetData);

      // Vérifier d'abord les données locales
      if (!sheetData || sheetData.length === 0) {
        console.log("⚠️ Aucune donnée locale, tentative de rechargement...");
        
        if (refreshData) {
          toast.info("Rechargement des données...");
          await refreshData();
          return; // L'extraction se relancera automatiquement quand les données seront chargées
        }
        
        toast.error("Aucune donnée disponible. Veuillez d'abord vous connecter à Google Sheets et vérifier que votre feuille contient des données.");
        return;
      }

      // Vérifier que nous avons suffisamment de données
      if (sheetData.length <= 1) {
        toast.error("Le tableur doit contenir au moins une ligne d'en-têtes et une ligne de données");
        return;
      }

      console.log(`📊 Traitement de ${sheetData.length} lignes de données`);
      console.log("🏷️ En-têtes détectés:", sheetData[0]);
      
      // Utiliser le service d'extraction
      const extractedCampaigns = campaignExtractorService.extractCampaigns({
        id: sheet.id,
        content: sheetData,
        headers: sheetData[0] || [],
        lastModified: new Date().toISOString(),
      });
      
      console.log("✅ Campagnes extraites:", extractedCampaigns);
      
      if (extractedCampaigns.length === 0) {
        toast.error("Aucune campagne trouvée. Vérifiez que votre feuille contient les colonnes nécessaires (Nom de la campagne, Nom du groupe d'annonces, mots-clés).");
        return;
      }
      
      setCampaigns(extractedCampaigns);
      setIsExtracted(true);
      
      toast.success(`🎉 ${extractedCampaigns.length} campagne(s) extraite(s) avec succès`);
    } catch (error) {
      console.error("❌ Erreur lors de l'extraction des campagnes:", error);
      toast.error(`Erreur lors de l'extraction: ${error.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveCampaigns = async () => {
    toast.success("Campagnes enregistrées avec succès");
    onUpdateComplete();
  };

  const getDataInfo = () => {
    if (!sheetData) return "Aucune donnée chargée";
    if (sheetData.length === 0) return "Tableur vide";
    if (sheetData.length === 1) return "Seulement les en-têtes présents";
    return `${sheetData.length - 1} lignes de données disponibles`;
  };

  const getDataStatus = () => {
    if (!sheetData || sheetData.length === 0) {
      return { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" };
    }
    if (sheetData.length === 1) {
      return { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" };
    }
    return { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" };
  };

  const dataStatus = getDataStatus();
  const StatusIcon = dataStatus.icon;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Extraire les campagnes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informations de diagnostic améliorées */}
        <div className={`text-sm p-3 rounded-lg ${dataStatus.bg}`}>
          <div className="flex items-start space-x-2">
            <StatusIcon className={`h-4 w-4 mt-0.5 ${dataStatus.color}`} />
            <div className="space-y-1">
              <p><strong>Feuille:</strong> {sheet.name}</p>
              <p><strong>État des données:</strong> {getDataInfo()}</p>
              {sheetData && sheetData.length > 0 && (
                <>
                  <p><strong>Colonnes détectées:</strong> {sheetData[0]?.join(", ") || "Aucune"}</p>
                  {sheetData.length > 1 && (
                    <p><strong>Première ligne de données:</strong> {sheetData[1]?.slice(0, 3).join(", ")}...</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {!isExtracted ? (
          <div className="flex flex-col items-center space-y-3">
            {(!sheetData || sheetData.length <= 1) && (
              <div className="flex items-center text-amber-600 bg-amber-50 p-3 rounded-lg w-full">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <div className="space-y-1 text-sm">
                  <p>Problème de données détecté:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Vérifiez que vous êtes connecté à Google Sheets (onglet "Google Sheets")</li>
                    <li>Assurez-vous que votre feuille contient des données</li>
                    <li>Vérifiez que l'onglet s'appelle "Campagnes publicitaires" ou "Campagnes"</li>
                  </ul>
                </div>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button
                onClick={extractCampaigns}
                disabled={isExtracting}
                className="flex-1"
              >
                {isExtracting ? (
                  <span className="animate-spin mr-2">⊚</span>
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Extraire les campagnes
              </Button>
              
              {refreshData && (
                <Button
                  variant="outline"
                  onClick={refreshData}
                  disabled={isExtracting}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <CampaignTable 
              campaigns={campaigns} 
              setCampaigns={setCampaigns} 
            />
            <div className="flex justify-end mt-4">
              <Button onClick={handleSaveCampaigns}>
                Enregistrer les modifications
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CampaignExtractor;
