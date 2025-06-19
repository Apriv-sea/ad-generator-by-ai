
import React from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Settings } from "lucide-react";

interface SheetActionButtonsProps {
  onSubmit: () => void;
  onTestUserSheet: () => void;
  onGoToSettings: () => void;
  isLoading: boolean;
  hasInput: boolean;
}

const SheetActionButtons: React.FC<SheetActionButtonsProps> = ({
  onSubmit,
  onTestUserSheet,
  onGoToSettings,
  isLoading,
  hasInput
}) => {
  return (
    <div className="flex gap-2">
      <Button 
        onClick={onSubmit} 
        disabled={isLoading || !hasInput}
        className="flex-1"
      >
        {isLoading ? (
          <>
            <span className="animate-spin mr-2">⊚</span>
            Chargement...
          </>
        ) : (
          <>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Charger la feuille
          </>
        )}
      </Button>
      
      <Button 
        onClick={onTestUserSheet}
        variant="outline"
        size="sm"
      >
        Test ID utilisateur
      </Button>

      <Button 
        onClick={onGoToSettings}
        variant="outline"
        size="sm"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SheetActionButtons;
