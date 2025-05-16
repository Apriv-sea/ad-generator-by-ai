
import React from 'react';
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, ExternalLink, Check } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface GoogleSheetHeaderProps {
  isAuthenticated: boolean;
  validUrl: boolean;
  onOpenInNewTab: () => void;
  onCreateNewSheet: () => void;
}

const GoogleSheetHeader: React.FC<GoogleSheetHeaderProps> = ({
  isAuthenticated,
  validUrl,
  onOpenInNewTab,
  onCreateNewSheet
}) => {
  return (
    <div className="bg-primary/5 p-3 flex justify-between items-center">
      <div className="flex items-center">
        <FileSpreadsheet className="h-5 w-5 mr-2 text-primary" />
        <h3 className="font-medium">Google Sheets</h3>
      </div>
      <div className="flex gap-2">
        {validUrl && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={onOpenInNewTab}
            className="gap-1"
          >
            <ExternalLink className="h-4 w-4" />
            Ouvrir dans Google Sheets
          </Button>
        )}
      </div>
    </div>
  );
};

export const GoogleAuthHeader: React.FC<{ onCreateNewSheet: () => void }> = ({ onCreateNewSheet }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <Check className="h-5 w-5 mr-2 text-green-500" />
        <span className="text-sm font-medium">Connecté à Google Sheets</span>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCreateNewSheet}
            >
              Créer une nouvelle feuille
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Créer une nouvelle feuille Google Sheets avec votre compte</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default GoogleSheetHeader;
