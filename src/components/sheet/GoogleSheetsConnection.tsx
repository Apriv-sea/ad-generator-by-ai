
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader } from "lucide-react";
import { useGoogleSheets } from '@/contexts/GoogleSheetsContext';
import { googleSheetsCoreService } from '@/services/core/googleSheetsCore';

interface GoogleSheetsConnectionProps {
  onConnectionSuccess?: (sheetId: string) => void;
}

const GoogleSheetsConnection: React.FC<GoogleSheetsConnectionProps> = ({ onConnectionSuccess }) => {
  const [url, setUrl] = useState("");
  const { isLoading, error, connectToSheet, clearError } = useGoogleSheets();

  const handleConnect = async () => {
    if (!url.trim()) {
      return;
    }

    clearError();
    
    try {
      const sheetId = googleSheetsCoreService.extractSheetId(url);
      if (!sheetId) {
        throw new Error("URL Google Sheets invalide");
      }

      await connectToSheet(sheetId);
      
      if (onConnectionSuccess) {
        onConnectionSuccess(sheetId);
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion à une feuille Google Sheets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            URL de votre feuille Google Sheets :
          </label>
          <Input
            type="url"
            placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <Button 
          onClick={handleConnect} 
          disabled={isLoading || !url.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Connexion en cours...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Se connecter
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsConnection;
