
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center">Ad Content Generator</h1>
        <p className="text-xl text-center mb-10">
          Générez des titres et descriptions publicitaires efficaces en intégrant Google Sheets et l'IA
        </p>
        
        <div className="bg-slate-50 p-6 rounded-lg mb-10 shadow-sm">
          <p className="mb-4 text-center">
            Cet outil a été imaginé par Antoine, consultant senior SEA de l'agence RESONEO, pour simplifier et optimiser la création de contenu publicitaire.
          </p>
          <p className="mb-4">
            L'Ad Content Generator vous permet de générer automatiquement des titres et descriptions publicitaires optimisés pour vos campagnes SEA, en se basant sur les informations de vos clients et les mots-clés pertinents.
          </p>
          <p>
            <strong>Pourquoi nous demandons l'accès à votre compte Google :</strong> L'outil s'intègre directement avec Google Drive et Google Sheets pour récupérer vos données client et y écrire les annonces générées. Toutes les opérations sont transparentes et ne concernent que les documents que vous autorisez explicitement.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Commencez</CardTitle>
              <CardDescription>Connectez-vous avec votre compte Google</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Authentifiez-vous pour accéder à Google Drive et Sheets
              </p>
              <Button 
                className="w-full" 
                onClick={() => navigate("/auth")}
              >
                Connexion
              </Button>
            </CardContent>
          </Card>
          
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Comment ça marche</CardTitle>
              <CardDescription>Découvrez notre processus</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Intégration simple avec vos outils existants et génération de contenu par IA
              </p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate("/how-it-works")}
              >
                En savoir plus
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
