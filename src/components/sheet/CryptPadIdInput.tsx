
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { cryptpadService } from "@/services/cryptpad/cryptpadService";
import { cryptpadValidationService } from "@/services/sheets/cryptpadValidationService";
import { toast } from "sonner";

interface CryptPadIdInputProps {
  onSheetLoaded: (padId: string, data: any) => void;
  onConnectionSuccess?: () => void;
}

const CryptPadIdInput: React.FC<CryptPadIdInputProps> = ({ onSheetLoaded, onConnectionSuccess }) => {
  const [url, setUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!url.trim()) {
      setConnectionError("Veuillez entrer une URL CryptPad");
      return;
    }

    console.log("🔗 Tentative de connexion à l'URL:", url);
    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Valider l'URL
      const validation = cryptpadValidationService.validateCryptpadUrl(url);
      if (!validation.isValid) {
        throw new Error(validation.error || "URL invalide");
      }

      // Extraire l'ID du pad
      const padId = cryptpadService.extractPadId(url);
      if (!padId) {
        throw new Error("Impossible d'extraire l'ID du pad depuis cette URL");
      }

      console.log("🆔 ID du pad extrait:", padId);

      // Récupérer les données
      console.log("📊 Récupération des données...");
      const data = await cryptpadService.getSheetData(padId);
      
      console.log("✅ Données récupérées:", {
        title: data.title,
        rowCount: data.values?.length || 0,
        headers: data.values?.[0],
        hasData: data.values && data.values.length > 1
      });

      if (!data.values || data.values.length === 0) {
        throw new Error("Aucune donnée trouvée dans la feuille CryptPad");
      }

      if (data.values.length === 1) {
        console.warn("⚠️ Seulement les en-têtes trouvés, pas de données");
        toast.warning("Seuls les en-têtes ont été trouvés. Ajoutez des données dans votre feuille CryptPad.");
      }

      // Succès !
      onSheetLoaded(padId, data);
      toast.success(`Connexion réussie ! ${data.values.length - 1} ligne(s) de données trouvée(s).`);
      
      if (onConnectionSuccess) {
        onConnectionSuccess();
      }

    } catch (error) {
      console.error("❌ Erreur de connexion:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur de connexion inconnue";
      setConnectionError(errorMessage);
      toast.error(`Échec de connexion: ${errorMessage}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const openCryptPadHelp = () => {
    window.open("https://docs.cryptpad.fr/en/user_guide/apps/calc.html", "_blank");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Connexion CryptPad</span>
            <Button variant="ghost" size="sm" onClick={openCryptPadHelp}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">URL de votre feuille CryptPad :</label>
            <Input
              type="url"
              placeholder="https://cryptpad.fr/sheet/#/2/sheet/edit/..."
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

          <Button 
            onClick={handleConnect} 
            disabled={isConnecting || !url.trim()}
            className="w-full"
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

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Assurez-vous que votre feuille CryptPad contient les en-têtes standards et des données.
              L'URL doit être celle d'édition (avec "/edit/" dans le lien).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default CryptPadIdInput;
