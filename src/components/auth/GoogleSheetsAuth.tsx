
import React, { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ExternalLink, LogOut, AlertCircle, Loader } from "lucide-react";
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
  const messageListenerRef = useRef<((event: MessageEvent) => void) | null>(null);

  useEffect(() => {
    if (isAuthenticated && onAuthSuccess) {
      console.log('Authentification détectée, appel du callback');
      onAuthSuccess();
    }
  }, [isAuthenticated, onAuthSuccess]);

  useEffect(() => {
    // Nettoyer l'ancien listener s'il existe
    if (messageListenerRef.current) {
      window.removeEventListener('message', messageListenerRef.current);
    }

    // Créer le nouveau listener
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
        
        // Forcer une actualisation du contexte
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
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

    messageListenerRef.current = handleMessage;
    window.addEventListener('message', handleMessage);
    
    return () => {
      if (messageListenerRef.current) {
        window.removeEventListener('message', messageListenerRef.current);
      }
    };
  }, []);

  const handleAuth = async () => {
    try {
      clearError();
      console.log('🚀 Démarrage de l\'authentification Google Sheets...');
      console.log('🌐 URL actuelle complète:', window.location.href);
      console.log('🌐 Origin actuel:', window.location.origin);
      console.log('🌐 Protocol:', window.location.protocol);
      console.log('🌐 Host:', window.location.host);
      
      // Fermer la fenêtre précédente si elle existe
      if (authWindowRef.current && !authWindowRef.current.closed) {
        authWindowRef.current.close();
      }
      
      console.log('📡 Appel de initiateAuth...');
      const authUrl = await initiateAuth();
      console.log('✅ URL d\'authentification générée:', authUrl);
      
      // Ouvrir la fenêtre d'authentification
      console.log('🌐 Ouverture de la fenêtre popup...');
      authWindowRef.current = window.open(
        authUrl, 
        'google-auth', 
        'width=600,height=700,scrollbars=yes,resizable=yes,left=' + (screen.width/2 - 300) + ',top=' + (screen.height/2 - 350)
      );
      
      if (!authWindowRef.current) {
        console.error('❌ Impossible d\'ouvrir la fenêtre popup');
        toast.error('Impossible d\'ouvrir la fenêtre de connexion. Vérifiez que les popups ne sont pas bloquées.');
        return;
      }

      console.log('✅ Fenêtre popup ouverte avec succès');

      // Surveiller la fermeture de la fenêtre
      const checkClosed = setInterval(() => {
        if (authWindowRef.current?.closed) {
          clearInterval(checkClosed);
          authWindowRef.current = null;
          console.log('🔒 Fenêtre popup fermée');
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initiation de l\'authentification:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de l'ouverture de l'authentification: ${errorMessage}`);
    }
  };

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      if (authWindowRef.current && !authWindowRef.current.closed) {
        authWindowRef.current.close();
      }
    };
  }, []);

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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearError}>
                    Masquer
                  </Button>
                </div>
              </div>
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
          {isLoading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Connexion en cours...
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4 mr-2" />
              Se connecter à Google Sheets
            </>
          )}
        </Button>
        
        <div className="text-xs text-gray-500">
          <p>Permissions demandées :</p>
          <ul className="list-disc list-inside mt-1">
            <li>Lire vos feuilles Google Sheets</li>
            <li>Modifier vos feuilles Google Sheets</li>
            <li>Créer de nouvelles feuilles</li>
          </ul>
        </div>

        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <p><strong>🔧 Informations de débogage:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>URL actuelle: <code>{window.location.href}</code></li>
            <li>Origin: <code>{window.location.origin}</code></li>
            <li>Callback prévu: <code>{window.location.origin}/auth/callback/google</code></li>
          </ul>
        </div>

        {error && (
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p><strong>💡 Conseils de dépannage:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Vérifiez que votre URL actuelle est autorisée dans Google Cloud Console</li>
              <li>Vérifiez que l'URI de redirection correspond exactement</li>
              <li>Désactivez temporairement votre bloqueur de popup</li>
              <li>Essayez de recharger la page</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsAuth;
