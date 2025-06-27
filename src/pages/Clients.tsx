
import React from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ClientsList from "@/components/clients/ClientsList";
import AddClientDialog from "@/components/clients/AddClientDialog";

const Clients = () => {
  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestion des Clients</h1>
            <p className="text-gray-600">
              Configurez vos clients et leur contexte métier pour personnaliser le contenu généré
            </p>
          </div>
          <AddClientDialog 
            trigger={
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un client
              </Button>
            }
          />
        </div>

        <div className="grid gap-6">
          <ClientsList />
          
          <Card>
            <CardHeader>
              <CardTitle>Pourquoi configurer vos clients ?</CardTitle>
              <CardDescription>
                Les informations client permettent de personnaliser le contenu généré
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm"><strong>Contexte métier :</strong> Adaptez le ton et le vocabulaire selon le secteur d'activité</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm"><strong>Objectifs spécifiques :</strong> Orientez la génération selon les buts marketing du client</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm"><strong>Charte éditoriale :</strong> Respectez les guidelines de communication de chaque client</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Clients;
