
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Eye } from 'lucide-react';

interface DataPreviewStepProps {
  data?: any;
  onComplete: (data: any) => void;
  previousData: Record<string, any>;
}

const DataPreviewStep: React.FC<DataPreviewStepProps> = ({
  data,
  onComplete,
  previousData
}) => {
  const [previewData, setPreviewData] = useState<any[][]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Extract data from previous step
    const validationResult = previousData['sheet-validation']?.validationResult;
    if (validationResult?.data) {
      setPreviewData(validationResult.data);
    }
  }, [previousData]);

  const handleContinue = () => {
    onComplete({
      extractedData: previewData,
      rowCount: previewData.length - 1, // excluding header
      columnCount: previewData[0]?.length || 0
    });
  };

  if (previewData.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Aucune donnée disponible. Veuillez retourner à l'étape précédente.
        </AlertDescription>
      </Alert>
    );
  }

  const headers = previewData[0] || [];
  const dataRows = previewData.slice(1);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Aperçu des données extraites</h3>
        <p className="text-sm text-gray-600">
          {dataRows.length} lignes de données trouvées avec {headers.length} colonnes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            Données de la feuille
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, index) => (
                    <TableHead key={index} className="font-medium">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataRows.slice(0, 5).map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {headers.map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        {row[cellIndex] || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {dataRows.length > 5 && (
            <p className="text-xs text-gray-500 mt-2">
              ... et {dataRows.length - 5} autres lignes
            </p>
          )}
        </CardContent>
      </Card>

      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          Les données ont été extraites avec succès. Vous pouvez continuer vers la sélection du modèle IA.
        </AlertDescription>
      </Alert>

      <Button onClick={handleContinue} className="w-full">
        Continuer vers la sélection du modèle IA
      </Button>
    </div>
  );
};

export default DataPreviewStep;
