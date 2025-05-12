
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
