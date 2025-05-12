
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelSelect }) => {
  const models = ["gpt-4", "gpt-3.5-turbo", "gemini-pro"];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Modèle d'IA</CardTitle>
        <CardDescription>
          Sélectionnez le modèle à utiliser pour la génération de contenu
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {models.map((model) => (
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
      </CardContent>
    </Card>
  );
};

export default ModelSelector;
