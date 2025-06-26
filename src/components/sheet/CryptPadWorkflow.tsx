
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ArrowRight, Loader, AlertCircle } from "lucide-react";
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Workflow state tracking
  const [workflowState, setWorkflowState] = useState({
    connected: false,
    dataLoaded: false,
    campaignsExtracted: false,
    contentGenerated: false
  });

  // Restaurer l'état du workflow au chargement
  useEffect(() => {
    const savedSessions = cryptpadPersistenceService.getSessions();
    if (savedSessions.length > 0) {
      const lastSession = savedSessions[0];
      console.log("Session précédente trouvée:", lastSession);
      
      if (lastSession.padId && lastSession.campaigns) {
        toast.info(`Session précédente trouvée: ${lastSession.name}. Voulez-vous la restaurer ?`);
        // Auto-restore if data is available
        setConnectedSheetId(lastSession.padId);
        setExtractedCampaigns(lastSession.campaigns);
        setWorkflowClientInfo(lastSession.clientInfo || null);
        setWorkflowState({
          connected: true,
          dataLoaded: true,
          campaignsExtracted: lastSession.campaigns.length > 0,
          contentGenerated: false
        });
        setActiveTab("content");
      }
    }

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
    setIsConnecting(true);
    setConnectionError(null);
    setConnectedSheetId(padId);
    
    try {
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

        setWorkflowState(prev => ({
          ...prev,
          connected: true,
          dataLoaded: true
        }));

        // Rediriger automatiquement vers l'onglet d'extraction après connexion
        setActiveTab("extraction");
        toast.success("Connexion réussie ! Prêt pour l'extraction des campagnes.");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setConnectionError("Impossible de charger les données de la feuille");
      toast.error("Impossible de charger les données de la feuille");
    } finally {
      setIsConnecting(false);
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

    setWorkflowState(prev => ({
      ...prev,
      campaignsExtracted: campaigns.length > 0
    }));

    if (campaigns.length > 0) {
      setActiveTab("content");
      toast.success("Extraction terminée ! Prêt pour la génération de contenu.");
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

  const getTabStatus = (tabName: string) => {
    switch (tabName) {
      case "connection":
        if (isConnecting) return { icon: Loader, color: "text-blue-500", animate: true };
        if (connectionError) return { icon: AlertCircle, color: "text-red-500" };
        if (workflowState.connected) return { icon: CheckCircle, color: "text-green-500" };
        return { icon: ArrowRight, color: "text-gray-400" };
      
      case "extraction":
        if (workflowState.campaignsExtracted) return { icon: CheckCircle, color: "text-green-500" };
        if (workflowState.dataLoaded) return { icon: ArrowRight, color: "text-blue-500" };
        return { icon: ArrowRight, color: "text-gray-400" };
      
      case "content":
        if (workflowState.contentGenerated) return { icon: CheckCircle, color: "text-green-500" };
        if (workflowState.campaignsExtracted) return { icon: ArrowRight, color: "text-blue-500" };
        return { icon: ArrowRight, color: "text-gray-400" };
      
      default:
        return { icon: ArrowRight, color: "text-gray-400" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Workflow CryptPad</h2>
        <p className="text-muted-foreground">
          Connectez votre feuille CryptPad, extrayez vos campagnes et générez du contenu IA
        </p>
        
        {/* Indicateur de progression */}
        <div className="flex justify-center items-center mt-4 space-x-2">
          <Badge variant={workflowState.connected ? "default" : "secondary"}>
            1. Connexion {workflowState.connected && "✓"}
          </Badge>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <Badge variant={workflowState.campaignsExtracted ? "default" : "secondary"}>
            2. Extraction {workflowState.campaignsExtracted && "✓"}
          </Badge>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <Badge variant={workflowState.contentGenerated ? "default" : "secondary"}>
            3. Contenu IA {workflowState.contentGenerated && "✓"}
          </Badge>
        </div>
      </div>

      {/* Alertes d'état */}
      {connectionError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">
            {connectionError}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection" className="flex items-center space-x-2">
            {(() => {
              const status = getTabStatus("connection");
              const Icon = status.icon;
              return (
                <>
                  <Icon className={`h-4 w-4 ${status.color} ${status.animate ? 'animate-spin' : ''}`} />
                  <span>1. Connexion</span>
                </>
              );
            })()}
          </TabsTrigger>
          <TabsTrigger 
            value="extraction" 
            disabled={!connectedSheetId}
            className="flex items-center space-x-2"
          >
            {(() => {
              const status = getTabStatus("extraction");
              const Icon = status.icon;
              return (
                <>
                  <Icon className={`h-4 w-4 ${status.color}`} />
                  <span>2. Extraction</span>
                </>
              );
            })()}
          </TabsTrigger>
          <TabsTrigger 
            value="content" 
            disabled={extractedCampaigns.length === 0}
            className="flex items-center space-x-2"
          >
            {(() => {
              const status = getTabStatus("content");
              const Icon = status.icon;
              return (
                <>
                  <Icon className={`h-4 w-4 ${status.color}`} />
                  <span>3. Contenu IA</span>
                </>
              );
            })()}
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
          {connectedSheetId && extractedCampaigns.length > 0 ? (
            <ContentGeneratorWorkflow
              sheetId={connectedSheetId}
              sheetData={sheetData}
              campaigns={extractedCampaigns}
              clientInfo={workflowClientInfo}
            />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Veuillez d'abord extraire des campagnes dans l'onglet précédent pour pouvoir générer du contenu.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CryptPadWorkflow;
