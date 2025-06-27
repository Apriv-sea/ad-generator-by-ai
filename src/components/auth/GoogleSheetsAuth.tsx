
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ExternalLink, LogOut } from "lucide-react";
import { realGoogleSheetsService } from "@/services/googlesheets/realGoogleSheetsService";
import { toast } from "sonner";

interface GoogleSheetsAuthProps {
  onAuthSuccess?: () => void;
}

const GoogleSheetsAuth: React.FC<GoogleSheetsAuthProps> = ({ onAuthSuccess }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsAuthenticated(realGoogleSheetsService.isAuthenticated());
  }, []);

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      const authUrl = await realGoogleSheetsService.initiateAuth();
      
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
      toast.error('Impossible de démarrer l\'authentification Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = async (code: string) => {
    try {
      await realGoogleSheetsService.completeAuth(code);
      setIsAuthenticated(true);
      onAuthSuccess?.();
    } catch (error) {
      console.error('Erreur completion auth:', error);
      toast.error('Erreur lors de l\'authentification');
    }
  };

  const handleLogout = () => {
    realGoogleSheetsService.logout();
    setIsAuthenticated(false);
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
              onClick={handleLogout}
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
