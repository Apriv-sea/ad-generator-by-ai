
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { googleSheetsService } from "@/services/googlesheets/googleSheetsService";
import { googleSheetsValidationService } from "@/services/sheets/googleSheetsValidationService";
import { toast } from "sonner";

interface GoogleSheetsIdInputProps {
  onSheetLoaded: (sheetId: string, data: any) => void;
  onConnectionSuccess?: () => void;
}

const GoogleSheetsIdInput: React.FC<GoogleSheetsIdInputProps> = ({ onSheetLoaded, onConnectionSuccess }) => {
  const [url, setUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!url.trim()) {
      setConnectionError("Veuillez entrer une URL Google Sheets");
      return;
    }

    console.log("🔗 Tentative de connexion à l'URL:", url);
    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Valider l'URL
      const validation = googleSheetsValidationService.validateGoogleSheetsUrl(url);
      if (!validation.isValid) {
        throw new Error(validation.error || "URL invalide");
      }

      // Extraire l'ID de la feuille
      const sheetId = googleSheetsService.extractSheetId(url);
      if (!sheetId) {
        throw new Error("Impossible d'extraire l'ID de la feuille depuis cette URL");
      }

      console.log("🆔 ID de la feuille extrait:", sheetId);

      // Vérifier d'abord si l'utilisateur est authentifié
      if (!googleSheetsService.isAuthenticated()) {
        setConnectionError("Vous devez d'abord vous authentifier avec Google Sheets. Rendez-vous dans l'onglet 'Authentification'.");
        return;
      }

      // Récupérer les données
      console.log("📊 Récupération des données...");
      const data = await googleSheetsService.getSheetData(sheetId);
      
      console.log("✅ Données récupérées:", {
        title: data.title,
        rowCount: data.values?.length || 0,
        headers: data.values?.[0],
        hasData: data.values && data.values.length > 1
      });

      if (!data.values || data.values.length === 0) {
        throw new Error("Aucune donnée trouvée dans la feuille Google Sheets. Vérifiez que votre feuille contient des données et qu'elle est accessible.");
      }

      if (data.values.length === 1) {
        console.warn("⚠️ Seulement les en-têtes trouvés, pas de données");
        toast.warning("Seuls les en-têtes ont été trouvés. Ajoutez des données dans votre feuille Google Sheets.");
      }

      // Succès !
      onSheetLoaded(sheetId, data);
      toast.success(`Connexion réussie ! ${data.values.length - 1} ligne(s) de données trouvée(s).`);
      
      if (onConnectionSuccess) {
        onConnectionSuccess();
      }

    } catch (error) {
      console.error("❌ Erreur de connexion:", error);
      let errorMessage = "Erreur de connexion inconnue";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Messages d'erreur plus spécifiques
        if (errorMessage.includes("not valid JSON") || errorMessage.includes("DOCTYPE")) {
          errorMessage = "La feuille Google Sheets n'est pas accessible. Assurez-vous qu'elle est partagée publiquement ou que vous êtes correctement authentifié.";
        } else if (errorMessage.includes("403")) {
          errorMessage = "Accès refusé à la feuille. Vérifiez que la feuille est partagée publiquement ou que votre authentification est valide.";
        } else if (errorMessage.includes("404")) {
          errorMessage = "Feuille introuvable. Vérifiez l'URL de votre feuille Google Sheets.";
        }
      }
      
      setConnectionError(errorMessage);
      toast.error(`Échec de connexion: ${errorMessage}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const openGoogleSheetsHelp = () => {
    window.open("https://support.google.com/docs/answer/6000292", "_blank");
  };

  const createNewSheet = () => {
    window.open(googleSheetsService.createNewSheetUrl(), "_blank");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Connexion Google Sheets</span>
            <Button variant="ghost" size="sm" onClick={openGoogleSheetsHelp}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">URL de votre feuille Google Sheets :</label>
            <Input
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isConnecting}
            />
          </div>

          {connectionError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {connectionError}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting || !url.trim()}
              className="flex-1"
            >
              {isConnecting ? (
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

            <Button 
              onClick={createNewSheet}
              variant="outline"
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Nouvelle feuille
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Assurez-vous que votre feuille Google Sheets est partagée publiquement 
              ou que vous êtes authentifié avec Google Sheets. La feuille doit contenir des en-têtes et des données.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleSheetsIdInput;
