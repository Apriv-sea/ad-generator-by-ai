
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, ExternalLink, CheckCircle, FileSpreadsheet, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface TemplateGuideProps {
  onSheetUrlSubmitted: (url: string) => void;
}

const TemplateGuide: React.FC<TemplateGuideProps> = ({ onSheetUrlSubmitted }) => {
  const [currentStep, setCurrentStep] = useState<'template' | 'url'>('template');
  const [userSheetUrl, setUserSheetUrl] = useState('');
  const [templateCopied, setTemplateCopied] = useState(false);

  const templateUrl = "https://docs.google.com/spreadsheets/d/18uELiv1vSb9eXSSu1tugMmNmmbq2VzyV7h04U8ywaz0/";

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(templateUrl);
    setTemplateCopied(true);
    toast.success("URL du template copiée dans le presse-papier");
  };

  const handleOpenTemplate = () => {
    window.open(templateUrl, '_blank');
    setTemplateCopied(true);
  };

  const handleContinueToUrl = () => {
    setCurrentStep('url');
  };

  const handleSubmitUrl = () => {
    if (!userSheetUrl.trim()) {
      toast.error("Veuillez entrer l'URL de votre feuille Google Sheets");
      return;
    }

    if (!userSheetUrl.includes('docs.google.com/spreadsheets')) {
      toast.error("Veuillez entrer une URL Google Sheets valide");
      return;
    }

    onSheetUrlSubmitted(userSheetUrl);
  };

  if (currentStep === 'template') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            Étape 1 : Copier le template Google Sheets
          </CardTitle>
          <CardDescription>
            Utilisez notre template pré-configuré avec les colonnes optimisées pour la génération de contenu publicitaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50">
            <FileSpreadsheet className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Template Google Sheets prêt à l'emploi</AlertTitle>
            <AlertDescription className="text-blue-700">
              Ce template contient toutes les colonnes nécessaires : nom de campagne, groupes d'annonces, 
              mots-clés, et espaces pour les titres et descriptions générés par l'IA.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                URL du template :
              </Label>
              <div className="flex gap-2">
                <Input 
                  value={templateUrl} 
                  readOnly 
                  className="bg-white text-sm"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopyTemplate}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Instructions :</h3>
                <ol className="text-sm text-gray-600 space-y-1 text-left max-w-md mx-auto">
                  <li>1. Cliquez sur "Ouvrir le template" ci-dessous</li>
                  <li>2. Dans Google Sheets, cliquez sur "Fichier" → "Faire une copie"</li>
                  <li>3. Donnez un nom à votre copie</li>
                  <li>4. Copiez l'URL de votre nouvelle feuille</li>
                  <li>5. Revenez ici pour coller l'URL</li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={handleOpenTemplate}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir le template
                </Button>
                
                {templateCopied && (
                  <Button 
                    onClick={handleContinueToUrl}
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    J'ai copié le template
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-600" />
          Étape 2 : Connecter votre feuille Google Sheets
        </CardTitle>
        <CardDescription>
          Collez l'URL de votre copie du template pour commencer à générer du contenu
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Template copié avec succès !</AlertTitle>
          <AlertDescription className="text-green-700">
            Maintenant, collez l'URL de votre feuille Google Sheets ci-dessous.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="sheetUrl" className="text-sm font-medium">
              URL de votre feuille Google Sheets
            </Label>
            <Input
              id="sheetUrl"
              type="url"
              value={userSheetUrl}
              onChange={(e) => setUserSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/VOTRE_ID/edit"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Assurez-vous que votre feuille est partagée avec l'accès "Toute personne avec le lien peut modifier"
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('template')}
              className="flex-1"
            >
              Retour au template
            </Button>
            <Button 
              onClick={handleSubmitUrl}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!userSheetUrl.trim()}
            >
              Connecter ma feuille
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateGuide;
