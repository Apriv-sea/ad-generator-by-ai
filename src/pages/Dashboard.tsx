
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";

const Dashboard = () => {
  const navigate = useNavigate();
  
  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Paramètres API</CardTitle>
              <CardDescription>Configurez vos clés API pour les différents LLMs</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => navigate("/settings")}
              >
                Configurer
              </Button>
            </CardContent>
          </Card>
          
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Mes clients</CardTitle>
              <CardDescription>Gérez vos clients et leurs informations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => navigate("/clients")}
              >
                Gérer les clients
              </Button>
            </CardContent>
          </Card>
          
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Génération de contenu</CardTitle>
              <CardDescription>Créez et gérez vos campagnes publicitaires</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => navigate("/campaigns")}
              >
                Gérer les campagnes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
