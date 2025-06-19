
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sheet } from "@/services/types";
import { sheetService } from "@/services/sheetService";
import CampaignsTabs from "./CampaignsTabs";
import CryptPadIdInput from "../sheet/CryptPadIdInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CampaignWorkflow: React.FC = () => {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("sheets");

  useEffect(() => {
    loadSheets();
  }, []);

  const loadSheets = async () => {
    setIsLoading(true);
    try {
      const allSheets = await sheetService.listSheets();
      setSheets(allSheets);
    } catch (error) {
      console.error("Erreur lors du chargement des feuilles:", error);
      toast.error("Impossible de charger la liste des feuilles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSheet = (sheet: Sheet) => {
    setSelectedSheet(sheet);
    setActiveTab("editor");
    toast.success(`Feuille "${sheet.name}" sélectionnée`);
  };

  const handleDeleteSheet = async (sheetId: string) => {
    try {
      await sheetService.deleteSheet(sheetId);
      await loadSheets();
      if (selectedSheet?.id === sheetId) {
        setSelectedSheet(null);
        setActiveTab("sheets");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Impossible de supprimer la feuille");
    }
  };

  const handleSheetCreated = () => {
    loadSheets();
  };

  const handleUpdateComplete = () => {
    console.log("Mise à jour terminée");
  };

  // Si aucune feuille n'existe, afficher la possibilité d'en connecter une
  if (!isLoading && sheets.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Commencer avec CryptPad</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Connectez une feuille CryptPad existante ou créez un nouveau projet.
            </p>
            <CryptPadIdInput 
              onSheetLoaded={(padId, data) => {
                toast.success("Feuille CryptPad connectée !");
                loadSheets();
              }} 
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <CampaignsTabs
      activeTab={activeTab}
      onTabChange={setActiveTab}
      selectedSheet={selectedSheet}
      sheets={sheets}
      isLoading={isLoading}
      onSelectSheet={handleSelectSheet}
      onDeleteSheet={handleDeleteSheet}
      onSheetCreated={handleSheetCreated}
      onRefreshSheets={loadSheets}
      onUpdateComplete={handleUpdateComplete}
    />
  );
};

export default CampaignWorkflow;
