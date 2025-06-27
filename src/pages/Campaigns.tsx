
import React from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import CampaignWorkflow from "@/components/campaign/CampaignWorkflow";

const Campaigns = () => {
  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Campagnes Publicitaires</h1>
          <p className="text-gray-600">
            Créez et optimisez vos campagnes Google Ads avec l'intelligence artificielle
          </p>
        </div>

        <div className="mb-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Processus de création :</strong> Connectez-vous à Google Sheets, définissez vos groupes d'annonces et mots-clés, 
              puis laissez l'IA générer des titres et descriptions optimisés pour chaque groupe.
            </AlertDescription>
          </Alert>
        </div>
        
        <CampaignWorkflow />
        
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Optimisation IA</CardTitle>
              <CardDescription>
                Comment l'IA optimise vos campagnes publicitaires
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm"><strong>Pertinence :</strong> Utilise le contexte client et les mots-clés pour créer du contenu ciblé</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm"><strong>Variété :</strong> Génère plusieurs versions pour tester différentes approches</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm"><strong>Conformité :</strong> Respecte les limites de caractères et bonnes pratiques Google Ads</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Campaigns;
