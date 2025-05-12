
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, googleSheetsService } from "@/services/googleSheetsService";
import SheetsList from "@/components/SheetsList";
import CreateSheetDialog from "@/components/CreateSheetDialog";

const Campaigns = () => {
  const { isAuthenticated, user } = useAuth();
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);

  const fetchSheets = async () => {
    if (!isAuthenticated) {
      toast.error("Veuillez vous connecter pour accéder à vos feuilles Google Sheets");
      return;
    }
    
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
    if (isAuthenticated) {
      fetchSheets();
    }
  }, [isAuthenticated]);

  const handleSelectSheet = (sheet: Sheet) => {
    setSelectedSheet(sheet);
    localStorage.setItem('selected_sheet', JSON.stringify(sheet));
    toast.success(`Feuille "${sheet.name}" sélectionnée avec succès!`);
  };

  const handleCreateSheet = () => {
    fetchSheets();
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Campagnes publicitaires</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Intégration Google Sheets</CardTitle>
            <CardDescription>
              Créez une nouvelle feuille ou connectez-vous à une feuille existante
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4">
            <CreateSheetDialog onSheetCreated={handleCreateSheet} />
            <Button 
              variant="outline" 
              onClick={fetchSheets}
              disabled={isLoading}
            >
              {isLoading ? "Chargement..." : "Rafraîchir la liste"}
            </Button>
          </CardContent>
        </Card>
        
        {!isAuthenticated ? (
          <div className="bg-muted/50 border rounded-lg p-8 text-center">
            <h3 className="text-xl font-semibold mb-3">Connexion requise</h3>
            <p className="mb-6">
              Veuillez vous connecter avec votre compte Google pour accéder à vos feuilles.
            </p>
          </div>
        ) : (
          <SheetsList 
            sheets={sheets} 
            onSelectSheet={handleSelectSheet} 
            isLoading={isLoading} 
          />
        )}
      </div>
    </>
  );
};

export default Campaigns;

