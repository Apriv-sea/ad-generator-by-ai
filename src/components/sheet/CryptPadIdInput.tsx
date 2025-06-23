
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cryptpadService } from "@/services/cryptpad/cryptpadService";
import { AlertCircle, FileSpreadsheet, Plus } from "lucide-react";

interface CryptPadIdInputProps {
  onSheetLoaded: (padId: string, data: any) => void;
  onConnectionSuccess?: () => void;
}

const CryptPadIdInput: React.FC<CryptPadIdInputProps> = ({ onSheetLoaded, onConnectionSuccess }) => {
  const [padInput, setPadInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shouldInitialize, setShouldInitialize] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!padInput.trim()) {
      toast.error("Veuillez entrer un ID ou une URL CryptPad");
      return;
    }

    setIsLoading(true);
    try {
      console.log("🚀 Début de la connexion CryptPad...");
      
      // Extraire l'ID du pad depuis l'URL si nécessaire
      let padId = padInput.trim();
      
      // Si c'est une URL complète, extraire l'ID
      if (padInput.includes('cryptpad.fr')) {
        const extractedId = cryptpadService.extractPadId(padInput);
        if (!extractedId) {
          toast.error("URL CryptPad invalide. Vérifiez le format.");
          return;
        }
        padId = extractedId;
      }

      console.log("📝 ID extrait:", padId);

      // Valider l'ID
      if (!cryptpadService.validatePadId(padId)) {
        toast.error("ID CryptPad invalide. Vérifiez le format.");
        return;
      }

      // Charger les données existantes
      let sheetData;
      try {
        console.log("📊 Chargement des données...");
        sheetData = await cryptpadService.getSheetData(padId);
        console.log("✅ Données chargées:", sheetData);
      } catch (error) {
        console.error("❌ Erreur lors du chargement:", error);
        toast.error("Impossible de charger la feuille. Vérifiez l'ID et les permissions.");
        return;
      }

      // Si l'option d'initialisation est cochée et que la feuille est vide ou n'a que des en-têtes basiques
      if (shouldInitialize && (!sheetData.values || sheetData.values.length <= 1 || 
          (sheetData.values.length > 0 && sheetData.values[0].length < 10))) {
        
        console.log("🔧 Initialisation de la feuille avec les en-têtes standards...");
        const success = await cryptpadService.initializeSheetWithHeaders(padId);
        
        if (success) {
          // Recharger les données après initialisation
          sheetData = await cryptpadService.getSheetData(padId);
          toast.success("Feuille initialisée avec les en-têtes standards");
        } else {
          toast.warning("Impossible d'initialiser la feuille, mais connexion réussie");
        }
      }

      console.log("🎉 Connexion réussie, appel des callbacks...");
      onSheetLoaded(padId, sheetData);
      
      // Redirection automatique après connexion réussie
      if (onConnectionSuccess) {
        console.log("🔄 Redirection automatique vers l'extraction...");
        setTimeout(() => {
          onConnectionSuccess();
        }, 1500); // Délai pour laisser l'utilisateur voir le message de succès
      }
      
    } catch (error) {
      console.error("💥 Erreur lors de la connexion à CryptPad:", error);
      toast.error("Erreur lors de la connexion. Vérifiez votre connexion et réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileSpreadsheet className="h-5 w-5 mr-2" />
          Connecter une feuille CryptPad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connectez-vous à une feuille CryptPad existante ou créez-en une nouvelle sur{" "}
            <a 
              href="https://cryptpad.fr/sheet/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline text-primary hover:text-primary/80"
            >
              cryptpad.fr/sheet
            </a>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cryptpad-input">
              URL ou ID de la feuille CryptPad
            </Label>
            <Input
              id="cryptpad-input"
              type="text"
              placeholder="https://cryptpad.fr/sheet/#/2/sheet/edit/... ou ID direct"
              value={padInput}
              onChange={(e) => setPadInput(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="initialize-headers"
              checked={shouldInitialize}
              onCheckedChange={(checked) => setShouldInitialize(checked as boolean)}
            />
            <Label htmlFor="initialize-headers" className="text-sm">
              Initialiser avec les en-têtes standards pour les campagnes publicitaires
            </Label>
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⊚</span>
                  Connexion...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Connecter la feuille
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Les en-têtes standards incluent : Nom de la campagne, Groupe d'annonces, Mots-clés, Titres, Descriptions, etc.</p>
          <p>• Cette option est recommandée pour les nouvelles feuilles</p>
          <p>• Pour les feuilles existantes, décochez cette option pour préserver vos données</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CryptPadIdInput;
