
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Sheet } from "@/services/googleSheetsService";
import GoogleSheetHeader, { GoogleAuthHeader } from './google/GoogleSheetHeader';
import GoogleSheetUrlInput from './google/GoogleSheetUrlInput';
import GoogleSheetEmbed from './google/GoogleSheetEmbed';
import GoogleSheetPlaceholder from './google/GoogleSheetPlaceholder';
import GoogleAuthPrompt from './google/GoogleAuthPrompt';
import {
  extractSheetId,
  generateEmbedUrl,
  checkGoogleAuth,
  initGoogleAuth
} from './google/googleSheetsUtils';

interface GoogleSheetsEmbedProps {
  sheetUrl?: string;
  onSheetUrlChange: (url: string) => void;
  sheet?: Sheet;
}

const GoogleSheetsEmbed: React.FC<GoogleSheetsEmbedProps> = ({
  sheetUrl,
  onSheetUrlChange,
  sheet
}) => {
  const [inputUrl, setInputUrl] = useState(sheetUrl || '');
  const [validUrl, setValidUrl] = useState(!!sheetUrl);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Vérifier si l'utilisateur est déjà authentifié avec Google
  useEffect(() => {
    const verifyAuthentication = async () => {
      const isAuth = await checkGoogleAuth();
      setIsAuthenticated(isAuth);
      if (!isAuth) {
        localStorage.removeItem('google_access_token');
      } else {
        setAuthError(null);
      }
    };
    
    verifyAuthentication();
  }, []);

  // Fonction pour gérer la soumission de l'URL
  const handleSubmit = () => {
    const sheetId = extractSheetId(inputUrl);
    
    if (!sheetId) {
      toast.error("URL Google Sheets invalide. Veuillez vérifier le format.");
      return;
    }
    
    const embedUrl = generateEmbedUrl(sheetId);
    onSheetUrlChange(embedUrl);
    setValidUrl(true);
    toast.success("Feuille Google Sheets intégrée avec succès");
  };

  // Fonction pour ouvrir la feuille dans un nouvel onglet
  const openInNewTab = () => {
    if (sheetUrl) {
      window.open(sheetUrl, '_blank');
    }
  };

  // Fonction pour gérer l'authentification Google
  const handleGoogleAuth = () => {
    setIsAuthenticating(true);
    setAuthError(null);
    
    const authUrl = initGoogleAuth();
    window.location.href = authUrl;
  };

  // Fonction pour créer une nouvelle feuille Google
  const createNewSheet = async () => {
    if (!isAuthenticated) {
      toast.error("Veuillez vous connecter à Google Sheets d'abord");
      return;
    }
    
    try {
      const accessToken = localStorage.getItem('google_access_token');
      if (!accessToken) {
        toast.error("Token d'accès Google non trouvé");
        return;
      }
      
      // Titre de la feuille (utiliser le nom de la feuille actuelle ou un défaut)
      const sheetTitle = sheet ? sheet.name : `Nouvelle feuille ${new Date().toLocaleDateString()}`;
      
      const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: sheetTitle
          },
          sheets: [
            {
              properties: {
                title: "Campagnes publicitaires",
                gridProperties: {
                  rowCount: 100,
                  columnCount: 18
                }
              }
            }
          ]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`Erreur lors de la création: ${errorData.error?.message || "Erreur inconnue"}`);
        return;
      }
      
      const data = await response.json();
      const newSheetUrl = generateEmbedUrl(data.spreadsheetId);
      
      // Mettre à jour l'URL et notifier
      setInputUrl(newSheetUrl);
      onSheetUrlChange(newSheetUrl);
      setValidUrl(true);
      toast.success("Nouvelle feuille Google Sheets créée avec succès");
      
    } catch (error) {
      console.error("Erreur lors de la création de la feuille:", error);
      toast.error("Impossible de créer une nouvelle feuille Google Sheets");
    }
  };

  // Vérifier si l'utilisateur vient d'être redirigé après une erreur d'authentification
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error) {
      setAuthError(`Erreur d'authentification: ${error}`);
      toast.error(`Erreur d'authentification Google: ${error}`);
    }
  }, []);

  return (
    <Card className="overflow-hidden border-none shadow-lg">
      <GoogleSheetHeader 
        isAuthenticated={isAuthenticated}
        validUrl={validUrl}
        onOpenInNewTab={openInNewTab}
        onCreateNewSheet={createNewSheet}
      />
      <CardContent className="p-4">
        <div className="space-y-4">
          {!isAuthenticated ? (
            <GoogleAuthPrompt 
              authError={authError}
              isAuthenticating={isAuthenticating}
              onGoogleAuth={handleGoogleAuth}
            />
          ) : (
            <>
              <GoogleAuthHeader onCreateNewSheet={createNewSheet} />
              
              <GoogleSheetUrlInput 
                inputUrl={inputUrl}
                onInputChange={setInputUrl}
                onSubmit={handleSubmit}
              />
              
              {validUrl && sheetUrl ? (
                <GoogleSheetEmbed sheetUrl={sheetUrl} />
              ) : (
                <GoogleSheetPlaceholder />
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsEmbed;
