
import React from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, ExternalLink } from "lucide-react";

interface CryptPadActionButtonsProps {
  onSubmit: () => void;
  onOpenCryptPad: () => void;
  isLoading: boolean;
  hasInput: boolean;
}

const CryptPadActionButtons: React.FC<CryptPadActionButtonsProps> = ({
  onSubmit,
  onOpenCryptPad,
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
        onClick={onOpenCryptPad}
        variant="outline"
        size="sm"
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        Ouvrir CryptPad
      </Button>
    </div>
  );
};

export default CryptPadActionButtons;
