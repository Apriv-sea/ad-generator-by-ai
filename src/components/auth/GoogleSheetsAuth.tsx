
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ExternalLink, LogOut, AlertCircle } from "lucide-react";
import { useGoogleSheets } from '@/contexts/GoogleSheetsContext';

interface GoogleSheetsAuthProps {
  onAuthSuccess?: () => void;
}

const GoogleSheetsAuth: React.FC<GoogleSheetsAuthProps> = ({ onAuthSuccess }) => {
  const { 
    isAuthenticated, 
    isLoading, 
    error, 
    initiateAuth, 
    logout, 
    clearError 
  } = useGoogleSheets();

  useEffect(() => {
    if (isAuthenticated && onAuthSuccess) {
      onAuthSuccess();
    }
  }, [isAuthenticated, onAuthSuccess]);

  const handleAuth = async () => {
    try {
      const authUrl = await initiateAuth();
      
      // Ouvrir la fenêtre d'authentification
      window.open(authUrl, 'google-auth', 'width=500,height=600');
      
      // Écouter les messages de la fenêtre popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          handleAuthSuccess(event.data.code);
          window.removeEventListener('message', handleMessage);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
    } catch (error) {
      console.error('Erreur authentification:', error);
    }
  };

  const handleAuthSuccess = async (code: string) => {
    try {
      // Cette fonction sera appelée par le contexte via useEffect
      // Pas besoin de logique supplémentaire ici
    } catch (error) {
      console.error('Erreur completion auth:', error);
    }
  };

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
              {error}
              <Button variant="outline" size="sm" onClick={clearError} className="ml-2">
                Masquer
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <p className="text-sm text-gray-600">
          Connectez-vous à Google Sheets pour accéder à vos feuilles de calcul et les modifier directement.
        </p>
        
        <Button
          onClick={handleAuth}
          disabled={isLoading}
          className="w-full"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          {isLoading ? 'Connexion en cours...' : 'Se connecter à Google Sheets'}
        </Button>
        
        <div className="text-xs text-gray-500">
          <p>Permissions demandées :</p>
          <ul className="list-disc list-inside mt-1">
            <li>Lire vos feuilles Google Sheets</li>
            <li>Modifier vos feuilles Google Sheets</li>
            <li>Créer de nouvelles feuilles</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsAuth;
