
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { Campaign, Client } from "@/services/types";
import { campaignExtractorService } from "@/services/storage/campaignExtractorService";
import { toast } from "sonner";

interface CampaignExtractorWorkflowProps {
  sheetId: string;
  sheetData: any[][] | null;
  clientInfo: Client | null;
  onCampaignsExtracted: (campaigns: Campaign[]) => void;
}

const CampaignExtractorWorkflow: React.FC<CampaignExtractorWorkflowProps> = ({
  sheetId,
  sheetData,
  clientInfo,
  onCampaignsExtracted
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionComplete, setExtractionComplete] = useState(false);

  useEffect(() => {
    if (sheetData && sheetData.length > 1) {
      extractCampaigns();
    }
  }, [sheetData]);

  const extractCampaigns = async () => {
    if (!sheetData || sheetData.length <= 1) {
      toast.error("Données insuffisantes dans la feuille");
      return;
    }

    setIsExtracting(true);
    try {
      console.log("🚀 Extraction des campagnes depuis:", sheetId);
      
      const extractedCampaigns = campaignExtractorService.extractCampaigns({
        id: sheetId,
        content: sheetData,
        headers: sheetData[0] || [],
        lastModified: new Date().toISOString(),
        clientInfo: clientInfo
      });

      if (extractedCampaigns.length === 0) {
        toast.error("Aucune campagne trouvée. Vérifiez la structure de votre feuille.");
        return;
      }

      setCampaigns(extractedCampaigns);
      setExtractionComplete(true);
      onCampaignsExtracted(extractedCampaigns);
      
      toast.success(`✅ ${extractedCampaigns.length} campagne(s) extraite(s) avec succès`);
      
    } catch (error) {
      console.error("Erreur lors de l'extraction:", error);
      toast.error("Erreur lors de l'extraction des campagnes");
    } finally {
      setIsExtracting(false);
    }
  };

  const getDataStatus = () => {
    if (!sheetData || sheetData.length === 0) {
      return { 
        icon: AlertCircle, 
        color: "text-red-600", 
        bg: "bg-red-50",
        message: "Aucune donnée chargée"
      };
    }
    if (sheetData.length === 1) {
      return { 
        icon: AlertCircle, 
        color: "text-amber-600", 
        bg: "bg-amber-50",
        message: "Seulement les en-têtes présents"
      };
    }
    return { 
      icon: CheckCircle, 
      color: "text-green-600", 
      bg: "bg-green-50",
      message: `${sheetData.length - 1} lignes de données disponibles`
    };
  };

  const dataStatus = getDataStatus();
  const StatusIcon = dataStatus.icon;

  return (
    <div className="space-y-6">
      {/* État des données */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse de la feuille CryptPad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg ${dataStatus.bg}`}>
            <div className="flex items-start space-x-3">
              <StatusIcon className={`h-5 w-5 mt-0.5 ${dataStatus.color}`} />
              <div className="space-y-2">
                <p className="font-medium">{dataStatus.message}</p>
                {sheetData && sheetData.length > 0 && (
                  <>
                    <p className="text-sm"><strong>En-têtes détectés:</strong> {sheetData[0]?.join(", ")}</p>
                    {sheetData.length > 1 && (
                      <p className="text-sm"><strong>Aperçu:</strong> {sheetData[1]?.slice(0, 3).join(" | ")}...</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {!extractionComplete && (
            <div className="mt-4">
              <Button
                onClick={extractCampaigns}
                disabled={isExtracting || !sheetData || sheetData.length <= 1}
                className="w-full"
              >
                {isExtracting ? (
                  <>
                    <span className="animate-spin mr-2">⊚</span>
                    Extraction en cours...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Extraire les campagnes
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résultats de l'extraction */}
      {extractionComplete && campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campagnes extraites ({campaigns.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campagne</TableHead>
                    <TableHead>Groupe d'annonces</TableHead>
                    <TableHead>Mots-clés</TableHead>
                    <TableHead>Client</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.slice(0, 10).map((campaign, index) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                      <TableCell>{campaign.adGroupName}</TableCell>
                      <TableCell className="max-w-xs truncate">{campaign.keywords}</TableCell>
                      <TableCell>{clientInfo?.name || "Non spécifié"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {campaigns.length > 10 && (
              <p className="text-sm text-gray-500 mt-2">
                ... et {campaigns.length - 10} campagne(s) supplémentaire(s)
              </p>
            )}

            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Extraction terminée ! Vous pouvez maintenant passer à l'étape de génération de contenu.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CampaignExtractorWorkflow;
