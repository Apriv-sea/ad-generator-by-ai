
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Settings, Users, Wand2 } from "lucide-react";

const HowItWorks = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Settings,
      title: "Configuration",
      description: "Connectez-vous et configurez vos clés API (OpenAI, Anthropic, Claude)",
      details: [
        "Création de compte sécurisée",
        "Ajout de clés API chiffrées",
        "Configuration des modèles IA"
      ]
    },
    {
      icon: Users,
      title: "Clients",
      description: "Créez les profils de vos clients avec leur contexte métier",
      details: [
        "Informations secteur d'activité",
        "Objectifs marketing spécifiques",
        "Charte éditoriale et ton souhaité"
      ]
    },
    {
      icon: Wand2,
      title: "Génération",
      description: "Créez vos campagnes et générez le contenu avec l'IA",
      details: [
        "Définition des groupes d'annonces",
        "Sélection des mots-clés principaux",
        "Génération automatique de titres et descriptions"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')}>
              ← Retour
            </Button>
            <Button onClick={() => navigate('/auth')}>
              Commencer
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Comment ça marche</h1>
            <p className="text-xl text-gray-600">
              Créez des campagnes Google Ads performantes en 3 étapes simples
            </p>
          </div>
          
          <div className="space-y-12">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <Card key={index} className="overflow-hidden">
                  <div className="flex">
                    <div className="bg-blue-600 text-white p-6 flex items-center justify-center min-w-[120px]">
                      <div className="text-center">
                        <IconComponent className="w-8 h-8 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{index + 1}</div>
                      </div>
                    </div>
                    <div className="flex-1 p-6">
                      <CardHeader className="p-0 mb-4">
                        <CardTitle className="text-xl">{step.title}</CardTitle>
                        <p className="text-gray-600">{step.description}</p>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ul className="space-y-2">
                          {step.details.map((detail, detailIndex) => (
                            <li key={detailIndex} className="flex items-center text-sm">
                              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Commencer maintenant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
