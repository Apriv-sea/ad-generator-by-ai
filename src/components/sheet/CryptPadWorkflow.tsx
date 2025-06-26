
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CryptPadEmbed from './CryptPadEmbed';
import CampaignExtractorWorkflow from '../campaign/CampaignExtractorWorkflow';
import ContentGeneratorWorkflow from '../campaign/ContentGeneratorWorkflow';
import { Sheet, Campaign, Client } from "@/services/types";
import { toast } from "sonner";
import { cryptpadService } from "@/services/cryptpad/cryptpadService";
import { cryptpadPersistenceService } from "@/services/storage/cryptpadPersistenceService";

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
  const [workflowClientInfo, setWorkflowClientInfo] = useState<Client | null>(clientInfo || null);

  // Restaurer l'état du workflow au chargement
  useEffect(() => {
    const savedSessions = cryptpadPersistenceService.getSessions();
    if (savedSessions.length > 0) {
      const lastSession = savedSessions[0];
      console.log("Session précédente trouvée:", lastSession);
      
      // Proposer de restaurer la dernière session
      if (lastSession.padId) {
        toast.info(`Session précédente trouvée: ${lastSession.name}. Voulez-vous la restaurer ?`);
      }
    }

    // Nettoyer les anciennes sessions
    cryptpadPersistenceService.cleanOldSessions();
  }, []);

  // Sauvegarder l'état du workflow quand il change
  useEffect(() => {
    if (connectedSheetId) {
      cryptpadPersistenceService.saveWorkflowState(connectedSheetId, {
        currentStep: activeTab as any,
        extractedCampaigns,
      });
    }
  }, [activeTab, connectedSheetId, extractedCampaigns]);

  const handleConnectionSuccess = async (padId: string) => {
    console.log("Connexion réussie, chargement des données...");
    setConnectedSheetId(padId);
    
    try {
      // Charger les données de la feuille
      const data = await cryptpadService.getSheetData(padId);
      if (data && data.values) {
        setSheetData(data.values);
        console.log("Données chargées:", data.values.length, "lignes");

        // Sauvegarder la session
        cryptpadPersistenceService.saveSession(padId, {
          name: data.title || `Feuille CryptPad ${new Date().toLocaleDateString()}`,
          sheetData: data,
          clientInfo: workflowClientInfo
        });
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
    console.log("Campagnes extraites:", campaigns);
    setExtractedCampaigns(campaigns);
    
    // Mettre à jour la session avec les campagnes extraites
    if (connectedSheetId) {
      cryptpadPersistenceService.updateSession(connectedSheetId, {
        campaigns
      });
    }

    if (campaigns.length > 0) {
      setActiveTab("content");
      toast.success("Prêt pour la génération de contenu !");
    } else {
      toast.warning("Aucune campagne valide trouvée. Vérifiez votre feuille.");
    }
  };

  const handleClientInfoUpdated = (newClientInfo: Client | null) => {
    setWorkflowClientInfo(newClientInfo);
    
    // Mettre à jour la session avec les nouvelles informations client
    if (connectedSheetId && newClientInfo) {
      cryptpadPersistenceService.updateSession(connectedSheetId, {
        clientInfo: newClientInfo
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Workflow CryptPad</h2>
        <p className="text-muted-foreground">
          Connectez votre feuille CryptPad, extrayez vos campagnes et générez du contenu IA
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection">1. Connexion</TabsTrigger>
          <TabsTrigger value="extraction" disabled={!connectedSheetId}>
            2. Extraction
          </TabsTrigger>
          <TabsTrigger value="content" disabled={extractedCampaigns.length === 0}>
            3. Contenu IA
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
          {connectedSheetId && (
            <CampaignExtractorWorkflow
              sheetId={connectedSheetId}
              sheetData={sheetData}
              clientInfo={workflowClientInfo}
              onCampaignsExtracted={handleCampaignsExtracted}
              onClientInfoUpdated={handleClientInfoUpdated}
            />
          )}
        </TabsContent>
        
        <TabsContent value="content" className="space-y-4">
          {connectedSheetId && extractedCampaigns.length > 0 && (
            <ContentGeneratorWorkflow
              sheetId={connectedSheetId}
              sheetData={sheetData}
              campaigns={extractedCampaigns}
              clientInfo={workflowClientInfo}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CryptPadWorkflow;
