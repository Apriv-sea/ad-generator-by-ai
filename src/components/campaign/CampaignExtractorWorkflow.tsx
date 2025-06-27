
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { Campaign, Client } from "@/services/types";
import { campaignExtractorService } from "@/services/storage/campaignExtractorService";
import { toast } from "sonner";

interface CampaignExtractorWorkflowProps {
  sheetId: string;
  sheetData: any[][] | null;
  clientInfo: Client | null;
  onCampaignsExtracted: (campaigns: Campaign[]) => void;
  onClientInfoUpdated?: (newClientInfo: Client | null) => void;
}

const CampaignExtractorWorkflow: React.FC<CampaignExtractorWorkflowProps> = ({
  sheetId,
  sheetData,
  clientInfo,
  onCampaignsExtracted,
  onClientInfoUpdated
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionComplete, setExtractionComplete] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  useEffect(() => {
    console.log("🔄 Données de feuille mises à jour:", {
      sheetId,
      hasData: !!sheetData,
      dataLength: sheetData?.length || 0,
      firstRow: sheetData?.[0]
    });
    
    if (sheetData && sheetData.length > 1) {
      extractCampaigns();
    }
  }, [sheetData]);

  const extractCampaigns = async () => {
    if (!sheetData || sheetData.length <= 1) {
      const errorMsg = "Données insuffisantes dans la feuille";
      setExtractionError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsExtracting(true);
    setExtractionError(null);
    
    try {
      console.log("🚀 Démarrage extraction des campagnes depuis:", sheetId);
      console.log("📊 Données reçues:", {
        totalRows: sheetData.length,
        headers: sheetData[0],
        sampleRows: sheetData.slice(1, 3)
      });
      
      const extractedCampaigns = campaignExtractorService.extractCampaigns({
        id: sheetId,
        content: sheetData,
        headers: sheetData[0] || [],
        lastModified: new Date().toISOString(),
        clientInfo: clientInfo
      });

      console.log("📈 Résultat extraction:", extractedCampaigns);

      if (extractedCampaigns.length === 0) {
        const errorMsg = "Aucune campagne trouvée. Vérifiez que votre feuille contient les colonnes requises : 'Nom de la campagne', 'Nom du groupe d'annonces', 'Top 3 mots-clés'";
        setExtractionError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Vérifier si on a des campagnes valides (pas juste des données par défaut)
      const validCampaigns = extractedCampaigns.filter(c => 
        c.campaignName && 
        c.campaignName !== "" && 
        c.adGroupName && 
        c.adGroupName !== ""
      );

      if (validCampaigns.length === 0) {
        const errorMsg = "Les données extractées sont vides. Vérifiez que votre feuille contient des données dans les bonnes colonnes.";
        setExtractionError(errorMsg);
        toast.warning(errorMsg);
        setCampaigns(extractedCampaigns); // Montrer quand même pour diagnostic
      } else {
        setCampaigns(extractedCampaigns);
        setExtractionError(null);
        toast.success(`✅ ${validCampaigns.length} campagne(s) valide(s) extraite(s) avec succès`);
      }

      setExtractionComplete(true);
      onCampaignsExtracted(extractedCampaigns);
      
    } catch (error) {
      console.error("💥 Erreur lors de l'extraction:", error);
      const errorMsg = "Erreur lors de l'extraction des campagnes";
      setExtractionError(errorMsg + ": " + (error as Error).message);
      toast.error(errorMsg);
    } finally {
      setIsExtracting(false);
    }
  };

  const retryExtraction = () => {
    setExtractionComplete(false);
    setExtractionError(null);
    setCampaigns([]);
    extractCampaigns();
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
          <CardTitle>Analyse de la feuille Google Sheets</CardTitle>
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

          {/* Erreur d'extraction */}
          {extractionError && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <strong>Problème d'extraction:</strong> {extractionError}
              </AlertDescription>
            </Alert>
          )}

          {!extractionComplete && (
            <div className="mt-4">
              <Button
                onClick={extractCampaigns}
                disabled={isExtracting || !sheetData || sheetData.length <= 1}
                className="w-full"
              >
                {isExtracting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
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

          {extractionComplete && extractionError && (
            <div className="mt-4">
              <Button
                onClick={retryExtraction}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer l'extraction
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
                    <TableRow key={campaign.id} className={
                      !campaign.campaignName || !campaign.adGroupName ? 'bg-yellow-50' : ''
                    }>
                      <TableCell className="font-medium">
                        {campaign.campaignName || <span className="text-gray-400 italic">Vide</span>}
                      </TableCell>
                      <TableCell>
                        {campaign.adGroupName || <span className="text-gray-400 italic">Vide</span>}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {campaign.keywords || <span className="text-gray-400 italic">Aucun</span>}
                      </TableCell>
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

            {!extractionError ? (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Extraction terminée ! Vous pouvez maintenant passer à l'étape de génération de contenu.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="mt-4 border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  L'extraction a produit des résultats, mais certaines données semblent manquantes. 
                  Vérifiez que votre feuille Google Sheets contient bien des données dans les colonnes attendues.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CampaignExtractorWorkflow;
