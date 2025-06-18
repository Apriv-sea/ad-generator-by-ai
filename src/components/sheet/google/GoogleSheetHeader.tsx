
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Plus, CheckCircle, User } from "lucide-react";

interface GoogleSheetHeaderProps {
  isAuthenticated: boolean;
  validUrl: boolean;
  onOpenInNewTab: () => void;
  onCreateNewSheet: () => void;
  userInfo?: { email: string; scopes: string[] } | null;
}

const GoogleSheetHeader: React.FC<GoogleSheetHeaderProps> = ({
  isAuthenticated,
  validUrl,
  onOpenInNewTab,
  onCreateNewSheet,
  userInfo
}) => {
  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium">Google Sheets</h3>
          {isAuthenticated && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connecté
            </Badge>
          )}
        </div>
        
        {validUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenInNewTab}
            className="flex items-center"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Ouvrir
          </Button>
        )}
      </div>
      
      {isAuthenticated && userInfo && (
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-green-700">
            <User className="h-4 w-4" />
            <span>{userInfo.email}</span>
          </div>
          
          <Button
            onClick={onCreateNewSheet}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nouvelle feuille
          </Button>
        </div>
      )}
    </div>
  );
};

export default GoogleSheetHeader;
