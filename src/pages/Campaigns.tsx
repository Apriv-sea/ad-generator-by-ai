
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import { Sheet, googleSheetsService } from "@/services/googleSheetsService";
import SheetsList from "@/components/SheetsList";
import CreateSheetDialog from "@/components/CreateSheetDialog";
import CampaignManager from "@/components/CampaignManager";
import { FileSpreadsheet, RefreshCw } from "lucide-react";

const Campaigns = () => {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const [activeTab, setActiveTab] = useState("sheets");

  // Au chargement, vérifier s'il y a une feuille sélectionnée en localStorage
  useEffect(() => {
    const savedSheet = localStorage.getItem('selected_sheet');
    if (savedSheet) {
      try {
        const sheet = JSON.parse(savedSheet);
        setSelectedSheet(sheet);
        setActiveTab("editor");
      } catch (error) {
        console.error("Erreur lors de la récupération de la feuille sauvegardée:", error);
      }
    }
  }, []);

  const fetchSheets = async () => {
    setIsLoading(true);
    try {
      const sheetsList = await googleSheetsService.listSheets();
      setSheets(sheetsList);
    } catch (error) {
      console.error("Erreur lors de la récupération des feuilles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSheets();
  }, []);

  const handleSelectSheet = (sheet: Sheet) => {
    setSelectedSheet(sheet);
    localStorage.setItem('selected_sheet', JSON.stringify(sheet));
    toast.success(`Feuille "${sheet.name}" sélectionnée avec succès!`);
    setActiveTab("editor");
  };

  const handleDeleteSheet = async (sheetId: string) => {
    try {
      const success = await googleSheetsService.deleteSheet(sheetId);
      if (success) {
        // Si la feuille supprimée est celle qui est sélectionnée,
        // on désélectionne
        if (selectedSheet && selectedSheet.id === sheetId) {
          setSelectedSheet(null);
          localStorage.removeItem('selected_sheet');
          setActiveTab("sheets");
        }
        
        // Rafraîchir la liste des feuilles
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

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Campagnes publicitaires</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="sheets">Feuilles</TabsTrigger>
            <TabsTrigger value="editor" disabled={!selectedSheet}>
              Éditeur de Campagnes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sheets">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Gestion des feuilles</CardTitle>
                <CardDescription>
                  Créez une nouvelle feuille ou sélectionnez une feuille existante
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row gap-4">
                <CreateSheetDialog onSheetCreated={handleCreateSheet} />
                <Button 
                  variant="outline" 
                  onClick={fetchSheets}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? "Chargement..." : "Rafraîchir la liste"}
                </Button>
              </CardContent>
            </Card>
            
            <SheetsList 
              sheets={sheets} 
              onSelectSheet={handleSelectSheet}
              onDeleteSheet={handleDeleteSheet}
              isLoading={isLoading} 
            />
          </TabsContent>
          
          <TabsContent value="editor">
            {selectedSheet ? (
              <>
                <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center">
                      <FileSpreadsheet className="h-5 w-5 mr-2" />
                      {selectedSheet.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Dernière modification: {new Date(selectedSheet.lastModified).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("sheets")}
                    >
                      Retour aux Feuilles
                    </Button>
                  </div>
                </div>
                
                <CampaignManager 
                  sheet={selectedSheet} 
                  onUpdateComplete={handleCampaignUpdate} 
                />
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p>Aucune feuille sélectionnée. Veuillez retourner à l'onglet Feuilles pour en sélectionner une.</p>
                  <Button 
                    onClick={() => setActiveTab("sheets")} 
                    className="mt-4"
                  >
                    Voir les feuilles disponibles
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Campaigns;
