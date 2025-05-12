
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KeyRound, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
}

interface APIProvider {
  name: string;
  key: string;
  models: string[];
  keyLocalStorageName: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelSelect }) => {
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [availableProviders, setAvailableProviders] = useState<APIProvider[]>([]);
  
  const providers: APIProvider[] = [
    {
      name: "OpenAI",
      key: "",
      models: ["gpt-4", "gpt-3.5-turbo"],
      keyLocalStorageName: "openai_api_key"
    },
    {
      name: "Anthropic",
      key: "",
      models: ["claude-2", "claude-instant"],
      keyLocalStorageName: "anthropic_api_key"
    },
    {
      name: "Google",
      key: "",
      models: ["gemini-pro"],
      keyLocalStorageName: "google_api_key"
    }
  ];

  // Charger les clés API depuis le localStorage
  useEffect(() => {
    const providersWithKeys = providers.map(provider => {
      const savedKey = localStorage.getItem(provider.keyLocalStorageName) || "";
      return {
        ...provider,
        key: savedKey
      };
    });
    
    // Filtrer les fournisseurs avec des clés API valides
    const available = providersWithKeys.filter(provider => provider.key.trim() !== "");
    setAvailableProviders(available);
    
    // Sélectionner le premier fournisseur disponible
    if (available.length > 0 && !activeProvider) {
      setActiveProvider(available[0].name);
      
      // Sélectionner le premier modèle du fournisseur si le modèle actuel n'est pas valide
      const validModels = available.flatMap(p => p.models);
      if (!validModels.includes(selectedModel) && available[0].models.length > 0) {
        onModelSelect(available[0].models[0]);
      }
    }
  }, []);

  // Si aucun fournisseur disponible
  if (availableProviders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Modèle d'IA</CardTitle>
          <CardDescription>
            Ajoutez au moins une clé API pour générer du contenu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-amber-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Aucune clé API configurée</AlertTitle>
            <AlertDescription>
              Vous devez configurer au moins une clé API (OpenAI, Anthropic ou Google) 
              avant de pouvoir générer du contenu.
              <div className="mt-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/settings">
                    <KeyRound className="h-4 w-4 mr-1" />
                    Configurer les clés API
                  </Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Avec des fournisseurs disponibles
  return (
    <Card>
      <CardHeader>
        <CardTitle>Modèle d'IA</CardTitle>
        <CardDescription>
          Sélectionnez le modèle à utiliser pour la génération de contenu
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs 
          value={activeProvider || ""} 
          onValueChange={setActiveProvider}
          className="mb-4"
        >
          <TabsList className="mb-2">
            {availableProviders.map(provider => (
              <TabsTrigger key={provider.name} value={provider.name}>
                {provider.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {availableProviders.map(provider => (
            <TabsContent key={provider.name} value={provider.name}>
              <div className="grid grid-cols-2 gap-4">
                {provider.models.map((model) => (
                  <Button
                    key={model}
                    variant={selectedModel === model ? "default" : "outline"}
                    onClick={() => onModelSelect(model)}
                    className="justify-start"
                  >
                    {model}
                  </Button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ModelSelector;
