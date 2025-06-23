
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CryptPadEmbed from './CryptPadEmbed';
import CampaignExtractorWorkflow from '../campaign/CampaignExtractorWorkflow';
import { Sheet, Campaign, Client } from "@/services/types";
import { toast } from "sonner";
import { cryptpadService } from "@/services/cryptpad/cryptpadService";

interface CryptPadWorkflowProps {
  sheet?: Sheet;
  clientInfo?: Client | null;
}

const CryptPadWorkflow: React.FC<CryptPadWorkflowProps> = ({ sheet, clientInfo }) => {
  const [activeTab, setActiveTab] = useState("connection");
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetData, setSheetData] = useState<any[][] | null>(null);
  const [extractedCampaigns, setExtractedCampaigns] = useState<Campaign[]>([]);
  const [connectedSheetId, setConnectedSheetId] = useState<string | null>(null);

  const handleConnectionSuccess = async (padId: string) => {
    console.log("Connexion réussie, chargement des données...");
    setConnectedSheetId(padId);
    
    try {
      // Charger les données de la feuille
      const data = await cryptpadService.getSheetData(padId);
      if (data && data.values) {
        setSheetData(data.values);
        console.log("Données chargées:", data.values.length, "lignes");
      }
      
      // Rediriger automatiquement vers l'onglet d'extraction après connexion
      setActiveTab("extraction");
      toast.success("Prêt pour l'extraction des campagnes !");
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Impossible de charger les données de la feuille");
    }
  };

  const handleCampaignsExtracted = (campaigns: Campaign[]) => {
    setExtractedCampaigns(campaigns);
    if (campaigns.length > 0) {
      setActiveTab("content");
      toast.success("Prêt pour la génération de contenu !");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Workflow CryptPad</h2>
        <p className="text-muted-foreground">
          Connectez votre feuille CryptPad et extrayez vos campagnes
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection">1. Connexion</TabsTrigger>
          <TabsTrigger value="extraction" disabled={!connectedSheetId}>
            2. Extraction
          </TabsTrigger>
          <TabsTrigger value="content" disabled={extractedCampaigns.length === 0}>
            3. Contenu
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="connection" className="space-y-4">
          <CryptPadEmbed
            sheetUrl={sheetUrl}
            onSheetUrlChange={setSheetUrl}
            sheet={sheet}
            onConnectionSuccess={() => connectedSheetId && handleConnectionSuccess(connectedSheetId)}
          />
        </TabsContent>
        
        <TabsContent value="extraction" className="space-y-4">
          {connectedSheetId && (
            <CampaignExtractorWorkflow
              sheetId={connectedSheetId}
              sheetData={sheetData}
              clientInfo={clientInfo}
              onCampaignsExtracted={handleCampaignsExtracted}
            />
          )}
        </TabsContent>
        
        <TabsContent value="content" className="space-y-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Génération de contenu disponible après extraction des campagnes.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {extractedCampaigns.length} campagne(s) extraite(s)
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CryptPadWorkflow;
