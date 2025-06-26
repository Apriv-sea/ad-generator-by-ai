
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LLMProviderSetup from "@/components/llm/LLMProviderSetup";

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelSelect }) => {
  const handleModelSelected = (provider: string, model: string) => {
    // Combiner le provider et le modèle pour conserver la compatibilité
    const fullModelId = `${provider}:${model}`;
    onModelSelect(fullModelId);
  };

  // Extraire le provider et le modèle du selectedModel actuel
  const [currentProvider, currentModel] = selectedModel.includes(':') 
    ? selectedModel.split(':') 
    : ['', selectedModel];

  return (
    <div className="space-y-6">
      <LLMProviderSetup
        onModelSelected={handleModelSelected}
        selectedProvider={currentProvider}
        selectedModel={currentModel}
      />
    </div>
  );
};

export default ModelSelector;
