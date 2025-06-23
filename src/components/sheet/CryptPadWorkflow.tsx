
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CryptPadEmbed from './CryptPadEmbed';
import CampaignExtractorWorkflow from '../campaign/CampaignExtractorWorkflow';
import { Sheet, Campaign, Client } from "@/services/types";
import { toast } from "sonner";

interface CryptPadWorkflowProps {
  sheet?: Sheet;
  clientInfo?: Client | null;
}

const CryptPadWorkflow: React.FC<CryptPadWorkflowProps> = ({ sheet, clientInfo }) => {
  const [activeTab, setActiveTab] = useState("connection");
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetData, setSheetData] = useState<any[][] | null>(null);
  const [extractedCampaigns, setExtractedCampaigns] = useState<Campaign[]>([]);

  const handleConnectionSuccess = () => {
    // Rediriger automatiquement vers l'onglet d'extraction après connexion
    setActiveTab("extraction");
    toast.success("Prêt pour l'extraction des campagnes !");
  };

  const handleCampaignsExtracted = (campaigns: Campaign[]) => {
    setExtractedCampaigns(campaigns);
    if (campaigns.length > 0) {
      setActiveTab("content");
      toast.success("Prêt pour la génération de contenu !");
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="connection">Connexion CryptPad</TabsTrigger>
        <TabsTrigger value="extraction" disabled={!sheetUrl}>
          Extraction de campagnes
        </TabsTrigger>
        <TabsTrigger value="content" disabled={extractedCampaigns.length === 0}>
          Génération de contenu
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="connection" className="space-y-4">
        <CryptPadEmbed
          sheetUrl={sheetUrl}
          onSheetUrlChange={setSheetUrl}
          sheet={sheet}
          onConnectionSuccess={handleConnectionSuccess}
        />
      </TabsContent>
      
      <TabsContent value="extraction" className="space-y-4">
        {sheet && (
          <CampaignExtractorWorkflow
            sheetId={sheet.id}
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
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default CryptPadWorkflow;
