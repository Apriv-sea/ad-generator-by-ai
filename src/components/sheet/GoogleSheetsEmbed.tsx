
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, ExternalLink, Save, Check, Globe, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Sheet } from "@/services/googleSheetsService";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
    const checkGoogleAuth = () => {
      const token = localStorage.getItem('google_access_token');
      if (token) {
        // Vérifier si le token est toujours valide
        fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + token)
          .then(response => {
            if (response.ok) {
              setIsAuthenticated(true);
              setAuthError(null);
            } else {
              // Token invalide, supprimer
              localStorage.removeItem('google_access_token');
              setIsAuthenticated(false);
            }
          })
          .catch(() => {
            localStorage.removeItem('google_access_token');
            setIsAuthenticated(false);
          });
      }
    };
    
    checkGoogleAuth();
  }, []);

  // Fonction pour extraire l'ID de la feuille à partir de l'URL
  const extractSheetId = (url: string): string | null => {
    try {
      // Format typique: https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0
      const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      return match ? match[1] : null;
    } catch (error) {
      console.error("Erreur lors de l'extraction de l'ID de la feuille:", error);
      return null;
    }
  };

  // Fonction pour générer l'URL d'intégration
  const generateEmbedUrl = (sheetId: string): string => {
    return `https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing&embedded=true`;
  };

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
    
    // Configuration pour l'authentification OAuth2
    const clientId = "135447600769-22vd8jk726t5f8gp58robppv0v8eeme7.apps.googleusercontent.com"; // ID client Google mis à jour
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback/google');
    const scope = encodeURIComponent('https://www.googleapis.com/auth/spreadsheets');
    
    // Stocker l'état actuel pour la vérification après redirection
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('google_auth_state', state);
    
    // Afficher l'URL de redirection complète pour le débogage
    console.log("URL de redirection:", window.location.origin + '/auth/callback/google');
    
    // Rediriger vers l'URL d'authentification Google
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&state=${state}&prompt=consent`;
    
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

  return (
    <Card className="overflow-hidden border-none shadow-lg">
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
              onClick={openInNewTab}
              className="gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              Ouvrir dans Google Sheets
            </Button>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-4">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center py-8">
              <FileSpreadsheet className="h-12 w-12 mb-4 text-primary/50" />
              <h3 className="text-lg font-medium mb-2">Connectez-vous à Google Sheets</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Connectez votre compte Google pour créer et gérer vos feuilles directement depuis notre application
              </p>
              
              {authError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erreur d'authentification</AlertTitle>
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4 w-full max-w-md">
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTitle className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                    Configuration requise
                  </AlertTitle>
                  <AlertDescription className="text-sm space-y-2">
                    <p>Avant de vous connecter, assurez-vous que ces URLs sont correctement configurées dans votre console Google Cloud:</p>
                    
                    <div className="mt-2">
                      <p className="font-medium">URI JavaScript autorisée:</p>
                      <code className="bg-white p-1 block text-xs rounded border mt-1 mb-2 break-all">{window.location.origin}</code>
                    </div>
                    
                    <div>
                      <p className="font-medium">URI de redirection autorisée:</p>
                      <code className="bg-white p-1 block text-xs rounded border mt-1 break-all">{window.location.origin}/auth/callback/google</code>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <Button 
                  onClick={handleGoogleAuth} 
                  disabled={isAuthenticating}
                  className="w-full gap-2"
                >
                  <Globe className="h-4 w-4" />
                  {isAuthenticating ? "Connexion en cours..." : "Se connecter à Google Sheets"}
                </Button>
              </div>
            </div>
          ) : (
            <>
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
                        onClick={createNewSheet}
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
              
              <div className="flex gap-2">
                <Input
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Coller l'URL d'une feuille Google Sheets"
                  className="flex-1"
                />
                <Button onClick={handleSubmit}>
                  <Save className="h-4 w-4 mr-2" />
                  Intégrer
                </Button>
              </div>
              
              {validUrl && sheetUrl && (
                <div className="border rounded-md overflow-hidden" style={{ height: '700px' }}>
                  <iframe
                    src={sheetUrl}
                    title="Google Sheets Embed"
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                  />
                </div>
              )}
              
              {!validUrl && (
                <div className="p-8 text-center text-muted-foreground">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-25" />
                  <p>Collez l'URL d'une feuille Google Sheets pour l'intégrer ici ou créez-en une nouvelle.</p>
                  <p className="text-sm mt-2">
                    Format: https://docs.google.com/spreadsheets/d/VOTRE_ID_DE_FEUILLE/edit
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsEmbed;
