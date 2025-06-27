
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, Client } from "@/services/types";
import { sheetService } from "@/services/sheetService";
import { toast } from "sonner";
import SheetsTab from "./SheetsTab";
import CampaignManager from "../CampaignManager";
import GoogleSheetsWorkflow from "../sheet/GoogleSheetsWorkflow";

const CampaignWorkflow: React.FC = () => {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clientInfo, setClientInfo] = useState<Client | null>(null);

  useEffect(() => {
    loadSheets();
  }, []);

  const loadSheets = async () => {
    setIsLoading(true);
    try {
      const loadedSheets = await sheetService.listSheets();
      setSheets(loadedSheets);
    } catch (error) {
      console.error("Erreur lors du chargement des feuilles:", error);
      toast.error("Impossible de charger les feuilles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSheet = (sheet: Sheet) => {
    setSelectedSheet(sheet);
  };

  const handleDeleteSheet = async (sheetId: string) => {
    try {
      await sheetService.deleteSheet(sheetId);
      setSheets(sheets.filter(s => s.id !== sheetId));
      if (selectedSheet?.id === sheetId) {
        setSelectedSheet(null);
      }
      toast.success("Feuille supprimée avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Impossible de supprimer la feuille");
    }
  };

  const handleSheetCreated = () => {
    loadSheets();
  };

  const handleUpdateComplete = () => {
    loadSheets();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="googlesheets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="googlesheets">Google Sheets</TabsTrigger>
          <TabsTrigger value="manager" disabled={!selectedSheet}>
            Gestion
          </TabsTrigger>
        </TabsList>

        <TabsContent value="googlesheets" className="space-y-6">
          <GoogleSheetsWorkflow 
            sheet={selectedSheet} 
            clientInfo={clientInfo}
          />
        </TabsContent>

        <TabsContent value="manager" className="space-y-6">
          {selectedSheet && (
            <CampaignManager
              sheet={selectedSheet}
              onUpdateComplete={handleUpdateComplete}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignWorkflow;
