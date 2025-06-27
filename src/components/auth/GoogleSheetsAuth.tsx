
import React, { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ExternalLink, LogOut, AlertCircle } from "lucide-react";
import { useGoogleSheets } from '@/contexts/GoogleSheetsContext';
import { toast } from 'sonner';

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

  const authWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    if (isAuthenticated && onAuthSuccess) {
      console.log('Authentification détectée, appel du callback');
      onAuthSuccess();
    }
  }, [isAuthenticated, onAuthSuccess]);

  useEffect(() => {
    // Écouter les messages de la fenêtre popup
    const handleMessage = (event: MessageEvent) => {
      // Vérifier l'origine pour la sécurité
      if (event.origin !== window.location.origin) {
        console.log('Message ignoré - origine non autorisée:', event.origin);
        return;
      }

      console.log('Message reçu de la popup:', event.data);

      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        console.log('Authentification Google réussie !');
        toast.success('Authentification Google Sheets réussie !');
        
        // Fermer la fenêtre popup
        if (authWindowRef.current) {
          authWindowRef.current.close();
          authWindowRef.current = null;
        }
        
        // Le contexte devrait déjà être mis à jour via completeAuth
        // L'effet useEffect ci-dessus se chargera d'appeler onAuthSuccess
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        console.error('Erreur authentification Google:', event.data.error);
        toast.error(`Erreur d'authentification: ${event.data.error}`);
        
        // Fermer la fenêtre popup
        if (authWindowRef.current) {
          authWindowRef.current.close();
          authWindowRef.current = null;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleAuth = async () => {
    try {
      clearError();
      console.log('Démarrage de l\'authentification Google Sheets...');
      
      const authUrl = await initiateAuth();
      console.log('URL d\'authentification générée:', authUrl);
      
      // Ouvrir la fenêtre d'authentification
      authWindowRef.current = window.open(
        authUrl, 
        'google-auth', 
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      if (!authWindowRef.current) {
        toast.error('Impossible d\'ouvrir la fenêtre de connexion. Vérifiez que les popups ne sont pas bloquées.');
        return;
      }

      // Surveiller la fermeture de la fenêtre
      const checkClosed = setInterval(() => {
        if (authWindowRef.current?.closed) {
          clearInterval(checkClosed);
          authWindowRef.current = null;
          console.log('Fenêtre popup fermée');
        }
      }, 1000);
      
    } catch (error) {
      console.error('Erreur lors de l\'initiation de l\'authentification:', error);
      toast.error('Erreur lors de l\'ouverture de l\'authentification');
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
