
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";

const Campaigns = () => {
  const handleCreateSheet = () => {
    toast.info("Cette fonctionnalité sera implémentée avec l'intégration Google Sheets.");
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
            <Button onClick={handleCreateSheet}>Créer une nouvelle feuille</Button>
            <Button variant="outline" onClick={handleCreateSheet}>
              Sélectionner une feuille existante
            </Button>
          </CardContent>
        </Card>
        
        <div className="bg-muted/50 border rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold mb-3">Aucune campagne active</h3>
          <p className="mb-6">
            Vous n'avez pas encore connecté de feuille Google Sheets.
            <br />
            Créez une nouvelle feuille ou connectez-vous à une feuille existante pour commencer.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Button onClick={handleCreateSheet}>Créer une nouvelle feuille</Button>
            <Button variant="outline" onClick={handleCreateSheet}>
              Sélectionner une feuille existante
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Campaigns;
