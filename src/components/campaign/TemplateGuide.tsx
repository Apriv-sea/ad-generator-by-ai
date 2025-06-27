
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ExternalLink, FileSpreadsheet } from "lucide-react";
import ClientSelector from "./ClientSelector";
import { Client } from "@/services/types";

interface TemplateGuideProps {
  onSheetUrlSubmitted: (url: string, client?: Client) => void;
}

const TemplateGuide: React.FC<TemplateGuideProps> = ({ onSheetUrlSubmitted }) => {
  const [sheetUrl, setSheetUrl] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!sheetUrl.trim()) {
      toast.error("Veuillez saisir l'URL de votre feuille Google Sheets");
      return;
    }

    setIsSubmitting(true);
    try {
      onSheetUrlSubmitted(sheetUrl, selectedClient || undefined);
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      toast.error("Erreur lors de la connexion à la feuille");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            Étape 1: Créer votre feuille Google Sheets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Créez une nouvelle feuille de calcul Google Sheets pour vos campagnes publicitaires.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => window.open('https://sheets.google.com/create', '_blank')}
              className="flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Créer une feuille Google Sheets
            </Button>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-900">💡 Conseil</p>
            <p className="text-sm text-blue-800">
              Utilisez les colonnes: Nom de la campagne, Nom du groupe d'annonces, Top 3 mots-clés, Titre 1, Titre 2, Titre 3, Description 1, Description 2
            </p>
          </div>
        </CardContent>
      </Card>

      <ClientSelector
        selectedClientId={selectedClient?.id}
        onClientSelect={setSelectedClient}
        showCreateOption={true}
      />

      <Card>
        <CardHeader>
          <CardTitle>Étape 2: Connecter votre feuille</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sheet-url">URL de votre feuille Google Sheets</Label>
            <Input
              id="sheet-url"
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
            />
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-green-900">🔒 Sécurité</p>
            <p className="text-sm text-green-800">
              Vos données Google Sheets sont protégées par l'authentification OAuth2.
              Seules les feuilles que vous autorisez sont accessibles.
            </p>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !sheetUrl.trim()}
            className="w-full"
          >
            {isSubmitting ? "Connexion en cours..." : "Connecter la feuille"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateGuide;
