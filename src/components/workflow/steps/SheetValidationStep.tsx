
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, FileSpreadsheet, Download } from 'lucide-react';
import { toast } from 'sonner';
import { SheetValidationStep as ValidationStep } from '@/services/workflow/steps/SheetValidationStep';
import { getTemplateByType } from '@/services/workflow/templates/SheetTemplates';
import { extractSheetId } from '@/utils/sheetUtils';

interface SheetValidationStepProps {
  data?: any;
  onComplete: (data: any) => void;
  previousData: Record<string, any>;
}

const SheetValidationStep: React.FC<SheetValidationStepProps> = ({
  data,
  onComplete,
}) => {
  const [sheetUrl, setSheetUrl] = useState(data?.sheetUrl || '');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(data?.validationResult || null);
  const [showTemplate, setShowTemplate] = useState(false);

  const validationStep = new ValidationStep();

  const handleValidation = async () => {
    if (!sheetUrl) {
      toast.error('Veuillez entrer l\'URL de votre feuille Google Sheets');
      return;
    }

    const sheetId = extractSheetId(sheetUrl);
    if (!sheetId) {
      toast.error('URL invalide. Veuillez entrer une URL Google Sheets valide');
      return;
    }

    setIsValidating(true);
    try {
      const result = await validationStep.execute({ sheetId }, { metadata: {}, previousResults: {} });
      setValidationResult(result);

      if (result.suggestTemplate) {
        setShowTemplate(true);
      } else {
        // Validation réussie, passer à l'étape suivante
        onComplete({
          sheetUrl,
          sheetId,
          validationResult: result
        });
      }
    } catch (error) {
      toast.error('Erreur lors de la validation: ' + error.message);
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleUseTemplate = () => {
    const template = getTemplateByType(validationResult?.templateType || 'campaign-basic');
    
    // Créer un CSV du template pour téléchargement
    const csvContent = [
      template.headers,
      ...template.sampleData
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `template-${template.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Template téléchargé ! Importez-le dans votre feuille Google Sheets.');
  };

  const handleContinueAnyway = () => {
    onComplete({
      sheetUrl,
      sheetId: extractSheetId(sheetUrl),
      validationResult: validationResult
    });
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="sheetUrl">URL de la feuille Google Sheets</Label>
          <Input
            id="sheetUrl"
            type="url"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            Copiez l'URL complète de votre feuille Google Sheets
          </p>
        </div>

        <Button onClick={handleValidation} disabled={isValidating || !sheetUrl}>
          {isValidating ? (
            <>
              <span className="animate-spin mr-2">⊚</span>
              Validation en cours...
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Valider la feuille
            </>
          )}
        </Button>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div className="space-y-4">
          {validationResult.isValid && validationResult.hasRequiredColumns ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Feuille validée ✅</AlertTitle>
              <AlertDescription className="text-green-700">
                Votre feuille contient {validationResult.data.length - 1} lignes de données 
                avec les colonnes requises.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Template recommandé</AlertTitle>
              <AlertDescription className="text-yellow-700">
                {validationResult.templateType === 'empty-sheet' && 
                  'Votre feuille est vide. Nous recommandons d\'utiliser notre template.'}
                {validationResult.templateType === 'missing-columns' && 
                  'Votre feuille ne contient pas les colonnes requises.'}
                {validationResult.templateType === 'missing-data' && 
                  'Votre feuille contient les bonnes colonnes mais manque de données.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Template Section */}
          {showTemplate && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">Template recommandé</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Téléchargez notre template avec les colonnes optimisées pour la génération de contenu publicitaire.
                </p>
                
                <div className="flex gap-3">
                  <Button onClick={handleUseTemplate} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger le template
                  </Button>
                  
                  <Button onClick={handleContinueAnyway} variant="outline">
                    Continuer sans template
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default SheetValidationStep;
