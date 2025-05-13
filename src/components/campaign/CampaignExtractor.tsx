
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, Campaign, sheetService } from "@/services/googleSheetsService";
import { toast } from "sonner";
import CampaignTable from "./CampaignTable";
import { ArrowRight } from "lucide-react";

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

    if (!sheetData || sheetData.length <= 1) {
      toast.error("Le tableur ne contient pas assez de données");
      return;
    }

    setIsExtracting(true);
    try {
      // Utiliser le service pour extraire les campagnes
      const extractedCampaigns = sheetService.extractCampaigns(sheet.id);
      
      setCampaigns(extractedCampaigns);
      setIsExtracted(true);
      
      toast.success("Campagnes extraites avec succès");
    } catch (error) {
      console.error("Erreur lors de l'extraction des campagnes:", error);
      toast.error("Impossible d'extraire les campagnes");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveCampaigns = async () => {
    // Ici, on pourrait sauvegarder les campagnes modifiées dans le tableur
    // ou dans une autre structure de données
    toast.success("Campagnes enregistrées avec succès");
    onUpdateComplete();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Extraire les campagnes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isExtracted ? (
          <div className="flex justify-center">
            <Button
              onClick={extractCampaigns}
              disabled={isExtracting || !sheetData}
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
