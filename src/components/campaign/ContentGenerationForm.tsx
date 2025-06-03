
import React from "react";
import { Button } from "@/components/ui/button";
import { FilePlus } from "lucide-react";
import { Client } from "@/services/types/client";
import ModelSelector from "./ModelSelector";

interface ContentGenerationFormProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
  onGenerate: () => void;
  isSaving: boolean;
  clientInfo: Client | null;
  sheetData: any[][] | null;
}

const ContentGenerationForm: React.FC<ContentGenerationFormProps> = ({
  selectedModel,
  onModelSelect,
  onGenerate,
  isSaving,
  clientInfo,
  sheetData
}) => {
  return (
    <div className="space-y-4">
      <ModelSelector 
        selectedModel={selectedModel} 
        onModelSelect={onModelSelect} 
      />

      <div className="flex justify-end">
        <Button
          onClick={onGenerate}
          disabled={isSaving || !clientInfo || !sheetData || sheetData.length <= 1}
        >
          {isSaving ? (
            <>
              <span className="animate-spin mr-2">⊚</span>
              Génération...
            </>
          ) : (
            <>
              <FilePlus className="h-4 w-4 mr-1" />
              Générer le Contenu
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ContentGenerationForm;
