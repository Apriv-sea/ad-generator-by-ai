
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, Campaign, sheetService } from "@/services/googleSheetsService";
import { toast } from "sonner";
import CampaignTable from "./CampaignTable";
import { ArrowRight, AlertCircle } from "lucide-react";
import { campaignExtractorService } from "@/services/storage/campaignExtractorService";

interface CampaignExtractorProps {
  sheet: Sheet;
  sheetData: any[][] | null;
  onUpdateComplete: () => void;
}

const CampaignExtractor: React.FC<CampaignExtractorProps> = ({ 
  sheet, 
  sheetData, 
  onUpdateComplete 
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
      console.log("Extraction des campagnes pour la feuille:", sheet.id);
      console.log("Données du tableur disponibles:", sheetData);

      // Vérifier d'abord les données locales
      if (!sheetData || sheetData.length === 0) {
        console.log("Aucune donnée locale, tentative de rechargement depuis Google Sheets");
        
        // Essayer de recharger les données depuis Google Sheets
        try {
          const freshData = await sheetService.getSheetData(sheet.id);
          if (freshData && freshData.values && freshData.values.length > 0) {
            console.log("Données fraîches récupérées:", freshData.values);
            
            // Utiliser le service d'extraction avec les nouvelles données
            const extractedCampaigns = campaignExtractorService.extractCampaigns({
              id: sheet.id,
              content: freshData.values,
              headers: freshData.values[0] || [],
              lastModified: new Date().toISOString(),
            });
            
            setCampaigns(extractedCampaigns);
            setIsExtracted(true);
            toast.success(`${extractedCampaigns.length} campagnes extraites avec succès`);
            return;
          }
        } catch (error) {
          console.error("Erreur lors du rechargement des données:", error);
        }
        
        toast.error("Impossible de récupérer les données du tableur. Veuillez vérifier que la feuille contient des données et qu'elle est accessible.");
        return;
      }

      // Vérifier que nous avons suffisamment de données
      if (sheetData.length <= 1) {
        toast.error("Le tableur doit contenir au moins une ligne d'en-têtes et une ligne de données");
        return;
      }

      console.log(`Traitement de ${sheetData.length} lignes de données`);
      
      // Utiliser le service d'extraction
      const extractedCampaigns = campaignExtractorService.extractCampaigns({
        id: sheet.id,
        content: sheetData,
        headers: sheetData[0] || [],
        lastModified: new Date().toISOString(),
      });
      
      console.log("Campagnes extraites:", extractedCampaigns);
      
      if (extractedCampaigns.length === 0) {
        toast.error("Aucune campagne trouvée dans les données. Vérifiez que les colonnes 'Nom de la campagne', 'Nom du groupe d'annonces' et 'Top 3 mots-clés' sont présentes.");
        return;
      }
      
      setCampaigns(extractedCampaigns);
      setIsExtracted(true);
      
      toast.success(`${extractedCampaigns.length} campagnes extraites avec succès`);
    } catch (error) {
      console.error("Erreur lors de l'extraction des campagnes:", error);
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

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Extraire les campagnes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informations de débogage */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <p><strong>Feuille:</strong> {sheet.name}</p>
          <p><strong>État des données:</strong> {getDataInfo()}</p>
          {sheetData && sheetData.length > 0 && (
            <p><strong>Colonnes détectées:</strong> {sheetData[0]?.join(", ") || "Aucune"}</p>
          )}
        </div>

        {!isExtracted ? (
          <div className="flex flex-col items-center space-y-3">
            {!sheetData || sheetData.length <= 1 ? (
              <div className="flex items-center text-amber-600 bg-amber-50 p-3 rounded-lg w-full">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">
                  Veuillez d'abord vous assurer que votre feuille Google Sheets contient des données. 
                  Allez dans l'onglet "Google Sheets" pour vérifier le contenu.
                </span>
              </div>
            ) : null}
            
            <Button
              onClick={extractCampaigns}
              disabled={isExtracting}
              className="w-full max-w-md"
            >
              {isExtracting ? (
                <span className="animate-spin mr-2">⊚</span>
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Extraire les campagnes et groupes d'annonces
            </Button>
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
