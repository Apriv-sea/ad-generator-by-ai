
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Target, Play } from 'lucide-react';

interface ResultMappingStepProps {
  data?: any;
  onComplete: (data: any) => void;
  previousData: Record<string, any>;
}

const ResultMappingStep: React.FC<ResultMappingStepProps> = ({
  data,
  onComplete,
  previousData
}) => {
  const [columnMappings, setColumnMappings] = useState(data?.columnMappings || {});
  const [isConfigValid, setIsConfigValid] = useState(false);

  // Get available columns from the sheet data
  const sheetData = previousData['data-preview']?.extractedData || [];
  const availableColumns = sheetData[0] || [];

  // Define the content types that will be generated
  const contentTypes = [
    { id: 'title_1', label: 'Titre 1', required: true },
    { id: 'title_2', label: 'Titre 2', required: true },
    { id: 'title_3', label: 'Titre 3', required: false },
    { id: 'description_1', label: 'Description 1', required: true },
    { id: 'description_2', label: 'Description 2', required: true },
    { id: 'description_3', label: 'Description 3', required: false }
  ];

  useEffect(() => {
    // Check if all required mappings are configured
    const requiredTypes = contentTypes.filter(type => type.required);
    const hasAllRequired = requiredTypes.every(type => columnMappings[type.id]);
    setIsConfigValid(hasAllRequired);
  }, [columnMappings]);

  const handleMappingChange = (contentType: string, columnIndex: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [contentType]: columnIndex
    }));
  };

  const handleExecuteWorkflow = () => {
    const workflowConfig = {
      sheetData: previousData['sheet-validation'],
      extractedData: previousData['data-preview'],
      aiConfig: previousData['ai-selection'],
      columnMappings,
      contentTypes
    };

    onComplete(workflowConfig);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Configuration des résultats</h3>
        <p className="text-sm text-gray-600">
          Définissez où placer le contenu généré dans votre feuille Google Sheets
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Mapping des colonnes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {contentTypes.map((contentType) => (
            <div key={contentType.id} className="grid grid-cols-2 gap-4 items-center">
              <Label className="flex items-center">
                {contentType.label}
                {contentType.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Select
                value={columnMappings[contentType.id] || ''}
                onValueChange={(value) => handleMappingChange(contentType.id, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une colonne" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((column, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {column} (Colonne {String.fromCharCode(65 + index)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Récapitulatif de la configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            <strong>Feuille :</strong> {previousData['sheet-validation']?.sheetId}
          </div>
          <div className="text-sm">
            <strong>Données :</strong> {previousData['data-preview']?.rowCount} lignes
          </div>
          <div className="text-sm">
            <strong>Modèle IA :</strong> {previousData['ai-selection']?.modelConfig?.name}
          </div>
          <div className="text-sm">
            <strong>Mappings configurés :</strong> {Object.keys(columnMappings).length}/{contentTypes.length}
          </div>
        </CardContent>
      </Card>

      {!isConfigValid && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertDescription className="text-yellow-700">
            Veuillez configurer au minimum les mappings requis (marqués d'un *) pour continuer.
          </AlertDescription>
        </Alert>
      )}

      <Button 
        onClick={handleExecuteWorkflow} 
        className="w-full" 
        disabled={!isConfigValid}
      >
        <Play className="w-4 h-4 mr-2" />
        Lancer le workflow
      </Button>
    </div>
  );
};

export default ResultMappingStep;
