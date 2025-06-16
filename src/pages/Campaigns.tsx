
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import { Sheet, sheetService } from "@/services/googleSheetsService";
import CampaignsHeader from "@/components/campaign/CampaignsHeader";
import CampaignsTabs from "@/components/campaign/CampaignsTabs";
import TemplateGuide from "@/components/campaign/TemplateGuide";

const Campaigns = () => {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const [activeTab, setActiveTab] = useState("template");
  const [showTemplateGuide, setShowTemplateGuide] = useState(true);

  // Au chargement, vérifier s'il y a une feuille sélectionnée en localStorage
  useEffect(() => {
    const savedSheet = localStorage.getItem('selected_sheet');
    if (savedSheet) {
      try {
        const sheet = JSON.parse(savedSheet);
        setSelectedSheet(sheet);
        setShowTemplateGuide(false);
        setActiveTab("editor");
      } catch (error) {
        console.error("Erreur lors de la récupération de la feuille sauvegardée:", error);
      }
    }
  }, []);

  const fetchSheets = async () => {
    setIsLoading(true);
    try {
      const sheetsList = await sheetService.listSheets();
      setSheets(sheetsList);
    } catch (error) {
      console.error("Erreur lors de la récupération des feuilles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!showTemplateGuide) {
      fetchSheets();
    }
  }, [showTemplateGuide]);

  const handleSelectSheet = (sheet: Sheet) => {
    setSelectedSheet(sheet);
    localStorage.setItem('selected_sheet', JSON.stringify(sheet));
    toast.success(`Feuille "${sheet.name}" sélectionnée avec succès!`);
    setActiveTab("editor");
  };

  const handleDeleteSheet = async (sheetId: string) => {
    try {
      const success = await sheetService.deleteSheet(sheetId);
      if (success) {
        if (selectedSheet && selectedSheet.id === sheetId) {
          setSelectedSheet(null);
          localStorage.removeItem('selected_sheet');
          setActiveTab("sheets");
        }
        await fetchSheets();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la feuille:", error);
      toast.error("Impossible de supprimer la feuille");
    }
  };

  const handleCreateSheet = () => {
    fetchSheets();
  };

  const handleCampaignUpdate = () => {
    toast.success("Données mises à jour avec succès");
  };

  const handleTemplateSheetUrl = (url: string) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      const sheetId = match[1];
      const newSheet: Sheet = {
        id: sheetId,
        name: "Feuille depuis template",
        url: url,
        lastModified: new Date().toISOString()
      };
      
      setSelectedSheet(newSheet);
      localStorage.setItem('selected_sheet', JSON.stringify(newSheet));
      setShowTemplateGuide(false);
      setActiveTab("editor");
      toast.success("Feuille connectée avec succès!");
    } else {
      toast.error("URL invalide");
    }
  };

  const handleBackToTemplate = () => {
    setShowTemplateGuide(true);
    setSelectedSheet(null);
    localStorage.removeItem('selected_sheet');
    setActiveTab("template");
  };

  if (showTemplateGuide) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto py-8 px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Démarrer avec le template Google Sheets</h1>
            <p className="text-gray-600">
              Suivez les étapes ci-dessous pour configurer votre feuille de campagnes publicitaires
            </p>
          </div>
          
          <TemplateGuide onSheetUrlSubmitted={handleTemplateSheetUrl} />
          
          <div className="mt-8 text-center">
            <Button 
              variant="outline" 
              onClick={() => setShowTemplateGuide(false)}
              className="text-sm"
            >
              Ou gérer mes feuilles existantes
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <CampaignsHeader onBackToTemplate={handleBackToTemplate} />
        
        <CampaignsTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedSheet={selectedSheet}
          sheets={sheets}
          isLoading={isLoading}
          onSelectSheet={handleSelectSheet}
          onDeleteSheet={handleDeleteSheet}
          onSheetCreated={handleCreateSheet}
          onRefreshSheets={fetchSheets}
          onUpdateComplete={handleCampaignUpdate}
        />
      </div>
    </>
  );
};

export default Campaigns;
