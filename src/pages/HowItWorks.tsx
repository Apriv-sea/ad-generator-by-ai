
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Comment ça marche</h1>
          <Button onClick={() => navigate('/')}>Retour</Button>
        </div>
        
        <div className="space-y-12">
          <Card>
            <CardHeader>
              <CardTitle>Étape 1: Connexion et configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Connexion à votre compte</h3>
                <p>Créez un compte ou connectez-vous pour accéder à l'application.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Configuration des clés API</h3>
                <p>Configurez au moins une clé API pour les services de génération de contenu (OpenAI, Anthropic).</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Étape 2: Création de votre base client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Ajoutez vos clients</h3>
                <p>Renseignez les informations clés pour chaque client: nom, contexte métier, spécificités, charte éditoriale.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Personnalisation du contenu</h3>
                <p>Ces informations seront utilisées pour personnaliser le contenu généré pour chaque client.</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Étape 3: Génération de contenu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Création d'une feuille</h3>
                <p>Créez ou sélectionnez une feuille dans l'éditeur intégré pour y stocker les campagnes.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Remplissage des premières colonnes</h3>
                <p>Complétez les informations de base: nom de campagne, nom d'ad group, top 3 keywords.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Génération automatique</h3>
                <p>Notre système générera automatiquement 10 titres et 5 descriptions pour chaque ligne.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Intégration dans l'éditeur</h3>
                <p>Les résultats sont automatiquement intégrés dans votre tableur.</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8 text-center">
          <Button size="lg" onClick={() => navigate('/auth')}>
            Commencer maintenant
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
