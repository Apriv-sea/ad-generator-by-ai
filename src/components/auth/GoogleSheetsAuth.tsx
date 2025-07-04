
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, LogOut, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGoogleSheets } from '@/contexts/GoogleSheetsContext';
import GoogleSheetsAuthButton from './GoogleSheetsAuthButton';

interface GoogleSheetsAuthProps {
  onAuthSuccess?: () => void;
}

const GoogleSheetsAuth: React.FC<GoogleSheetsAuthProps> = ({ onAuthSuccess }) => {
  const { 
    isAuthenticated, 
    isLoading, 
    error, 
    logout, 
    clearError 
  } = useGoogleSheets();

  useEffect(() => {
    if (isAuthenticated && onAuthSuccess) {
      console.log('Authentification détectée, appel du callback');
      onAuthSuccess();
    }
  }, [isAuthenticated, onAuthSuccess]);

  if (isAuthenticated) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          <div className="flex items-center justify-between">
            <span>Connecté à Google Sheets</span>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="ml-2"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Déconnecter
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion Google Sheets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Erreur d'authentification:</strong></p>
                <p className="text-sm">{error}</p>
                <Button variant="outline" size="sm" onClick={clearError}>
                  Masquer
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <p className="text-sm text-gray-600">
          Connectez-vous à Google Sheets pour accéder à vos feuilles de calcul et les modifier directement.
        </p>
        
        <GoogleSheetsAuthButton disabled={isLoading} />
        
        <div className="text-xs text-gray-500">
          <p>Permissions demandées :</p>
          <ul className="list-disc list-inside mt-1">
            <li>Lire vos feuilles Google Sheets</li>
            <li>Modifier vos feuilles Google Sheets</li>
            <li>Créer de nouvelles feuilles</li>
          </ul>
        </div>

        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <p><strong>🔧 Configuration requise:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>URL actuelle: <code>{window.location.origin}</code></li>
            <li>Callback: <code>{window.location.origin}/auth/google</code></li>
            <li>Ces URLs doivent être configurées dans Google Cloud Console</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsAuth;
