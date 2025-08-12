// Étape 2 : Import Google Sheets avec estimation automatique
// Preview des données + calcul coût/temps avant génération

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  FileSpreadsheet, Upload, CheckCircle, AlertCircle, 
  Clock, DollarSign, Eye, BarChart 
} from "lucide-react";

interface ImportStepProps {
  data: any;
  onDataUpdate: (updates: any) => void;
  onComplete: () => void;
}

interface SheetAnalysis {
  totalRows: number;
  campaignsCount: number;
  adGroupsCount: number;
  estimatedCost: number;
  estimatedTime: number;
  isEmpty: boolean;
  hasValidStructure: boolean;
}

const ImportStep: React.FC<ImportStepProps> = ({ data, onDataUpdate, onComplete }) => {
  const [sheetUrl, setSheetUrl] = useState(data.sheetUrl || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sheetAnalysis, setSheetAnalysis] = useState<SheetAnalysis | null>(null);
  const [sheetData, setSheetData] = useState(data.sheetData || null);
  const [showPreview, setShowPreview] = useState(false);

  const analyzeSheet = async () => {
    if (!sheetUrl.trim()) return;
    
    setIsAnalyzing(true);
    
    try {
      // Simulation de l'analyse (sera remplacé par vrai appel API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Données simulées
      const mockData = [
        ['Campagne', 'Groupe d\'annonces', 'Mots-clés'],
        ['Chaussures Sport', 'Running Homme', 'chaussures running, baskets sport, running homme'],
        ['Chaussures Sport', 'Running Femme', 'chaussures running femme, baskets sport femme'],
        ['Mode Été', 'Robes Été', 'robe été, robe légère, mode femme été'],
        ['Mode Été', 'Shorts Homme', 'short homme, bermuda, vêtement été']
      ];
      
      const analysis: SheetAnalysis = {
        totalRows: mockData.length - 1, // Sans les headers
        campaignsCount: 2,
        adGroupsCount: 4,
        estimatedCost: 3.80, // 0.95€ par groupe d'annonces
        estimatedTime: 45, // secondes
        isEmpty: false,
        hasValidStructure: true
      };
      
      setSheetData(mockData);
      setSheetAnalysis(analysis);
      
      // Mettre à jour les données du workflow
      onDataUpdate({
        sheetUrl,
        sheetData: mockData,
        estimatedCost: analysis.estimatedCost,
        estimatedTime: analysis.estimatedTime
      });
      
    } catch (error) {
      console.error('Erreur analyse:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderSheetPreview = () => {
    if (!sheetData || !showPreview) return null;
    
    return (
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Aperçu des données</span>
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPreview(false)}
            >
              Masquer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {sheetData[0].map((header: string, index: number) => (
                    <th key={index} className="text-left p-2 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheetData.slice(1, 6).map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex} className="border-b hover:bg-muted/50">
                    {row.map((cell: string, cellIndex: number) => (
                      <td key={cellIndex} className="p-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {sheetData.length > 6 && (
              <p className="text-center text-muted-foreground mt-2">
                ... et {sheetData.length - 6} ligne(s) supplémentaire(s)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAnalysisResults = () => {
    if (!sheetAnalysis) return null;
    
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <BarChart className="w-5 h-5 text-green-600" />
            <span>Analyse de la feuille</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Métriques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{sheetAnalysis.totalRows}</div>
              <div className="text-sm text-muted-foreground">Lignes de données</div>
            </div>
            
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{sheetAnalysis.campaignsCount}</div>
              <div className="text-sm text-muted-foreground">Campagnes</div>
            </div>
            
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{sheetAnalysis.adGroupsCount}</div>
              <div className="text-sm text-muted-foreground">Groupes d'annonces</div>
            </div>
            
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {sheetAnalysis.adGroupsCount * 19}
              </div>
              <div className="text-sm text-muted-foreground">Contenus à générer</div>
            </div>
          </div>

          {/* Estimations */}
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="flex flex-wrap items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Temps estimé: <strong>{sheetAnalysis.estimatedTime}s</strong></span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span>Coût estimé: <strong>{sheetAnalysis.estimatedCost.toFixed(2)}€</strong></span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Actions preview */}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Masquer' : 'Voir'} les données
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const canComplete = sheetAnalysis?.hasValidStructure && !sheetAnalysis.isEmpty;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
          <span>Import Google Sheets</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* URL de la feuille */}
        <div className="space-y-2">
          <Label htmlFor="sheetUrl">URL de la feuille Google Sheets</Label>
          <div className="flex space-x-2">
            <Input
              id="sheetUrl"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="flex-1"
            />
            <Button 
              onClick={analyzeSheet}
              disabled={!sheetUrl.trim() || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Analyse...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Analyser
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Collez l'URL de votre feuille Google Sheets publique
          </p>
        </div>

        {/* Résultats de l'analyse */}
        {renderAnalysisResults()}
        {renderSheetPreview()}

        {/* Actions */}
        <div className="flex justify-between">
          <div>
            {sheetAnalysis && (
              <Badge variant={canComplete ? "default" : "destructive"}>
                {canComplete ? "Prêt pour la génération" : "Structure invalide"}
              </Badge>
            )}
          </div>
          
          <Button 
            onClick={onComplete}
            disabled={!canComplete}
            className="bg-green-600 hover:bg-green-700"
          >
            Continuer vers la génération
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportStep;