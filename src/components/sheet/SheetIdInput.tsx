
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileSpreadsheet, Info, Settings } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/services/utils/supabaseUtils";

interface SheetIdInputProps {
  onSheetLoaded: (sheetId: string, data: any) => void;
}

const SheetIdInput: React.FC<SheetIdInputProps> = ({ onSheetLoaded }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const extractSheetId = (input: string): string | null => {
    const trimmed = input.trim();
    
    if (!trimmed.includes('docs.google.com') && !trimmed.includes('http')) {
      return trimmed;
    }
    
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const validateSheetId = (sheetId: string): boolean => {
    return /^[a-zA-Z0-9-_]{40,}$/.test(sheetId);
  };

  const getGoogleApiKey = async (): Promise<string | null> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('api_keys')
        .select('api_key')
        .eq('user_id', userId)
        .eq('service', 'google')
        .maybeSingle();

      if (error || !data) return null;
      return data.api_key;
    } catch (error) {
      console.error('Erreur lors de la récupération de la clé API:', error);
      return null;
    }
  };

  const getSheetData = async (sheetId: string): Promise<any> => {
    const apiKey = await getGoogleApiKey();
    
    if (!apiKey) {
      throw new Error('Clé API Google non configurée. Veuillez ajouter votre clé API Google dans les paramètres.');
    }

    const range = 'Sheet1';
    const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    const url = `${baseUrl}/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}?key=${apiKey}`;
    
    console.log('🔗 URL de requête:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('📡 Statut de la réponse:', response.status);
    console.log('📡 Headers de la réponse:', Object.fromEntries(response.headers));

    if (!response.ok) {
      let errorDetail = '';
      try {
        const errorBody = await response.text();
        console.log('❌ Corps de l\'erreur:', errorBody);
        errorDetail = errorBody;
      } catch (e) {
        errorDetail = 'Impossible de lire le détail de l\'erreur';
      }

      if (response.status === 400) {
        throw new Error(`Requête invalide (400). Détail: ${errorDetail}`);
      } else if (response.status === 403) {
        throw new Error('Feuille non accessible. Assurez-vous qu\'elle est partagée publiquement.');
      } else if (response.status === 404) {
        throw new Error('Feuille introuvable. Vérifiez l\'ID de la feuille.');
      } else {
        throw new Error(`Erreur ${response.status}: ${errorDetail}`);
      }
    }

    const data = await response.json();
    console.log('✅ Données reçues:', data);
    return data;
  };

  const getSheetInfo = async (sheetId: string): Promise<any> => {
    const apiKey = await getGoogleApiKey();
    
    if (!apiKey) {
      throw new Error('Clé API Google non configurée.');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Impossible de récupérer les infos: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      title: data.properties?.title || 'Feuille sans titre',
      sheets: data.sheets?.map((sheet: any) => ({
        title: sheet.properties?.title,
        id: sheet.properties?.sheetId
      })) || []
    };
  };

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast.error('Veuillez saisir l\'ID ou l\'URL de votre feuille');
      return;
    }

    setIsLoading(true);
    setDebugInfo('🔄 Extraction de l\'ID...');
    
    try {
      const sheetId = extractSheetId(input);
      if (!sheetId) {
        toast.error('URL ou ID invalide');
        setDebugInfo('❌ Impossible d\'extraire l\'ID');
        return;
      }

      if (!validateSheetId(sheetId)) {
        toast.error('Format d\'ID invalide');
        setDebugInfo('❌ Format d\'ID invalide');
        return;
      }

      console.log('🎯 ID extrait et validé:', sheetId);
      setDebugInfo(`✅ ID extrait: ${sheetId}`);

      setDebugInfo('📊 Chargement des données...');
      const sheetData = await getSheetData(sheetId);
      
      if (!sheetData.values || sheetData.values.length === 0) {
        toast.error('La feuille semble vide');
        setDebugInfo('⚠️ Feuille vide');
        return;
      }

      const sheetInfo = await getSheetInfo(sheetId);

      toast.success(`Feuille "${sheetInfo.title}" chargée avec succès`);
      setDebugInfo(`✅ Chargée: ${sheetInfo.title} (${sheetData.values.length} lignes)`);
      onSheetLoaded(sheetId, { ...sheetData, info: sheetInfo });
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      
      if (error.message?.includes('Clé API Google non configurée')) {
        toast.error('Veuillez configurer votre clé API Google dans les paramètres');
        setDebugInfo('❌ Clé API Google manquante');
      } else {
        toast.error(error.message || 'Erreur lors du chargement de la feuille');
        setDebugInfo(`❌ Erreur: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testUserSheet = () => {
    const userSheetId = '1uawoG2RorJDRrWtdLHEe9AD7sIoRWmp9h_vAAtr5vVI';
    setInput(userSheetId);
    setDebugInfo('🎯 ID utilisateur prêt pour le test');
  };

  const goToSettings = () => {
    window.location.href = '/settings';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileSpreadsheet className="h-5 w-5 mr-2" />
          Connecter votre Google Sheets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Prérequis :</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Configurez votre clé API Google dans les paramètres</li>
              <li>Ouvrez votre Google Sheets</li>
              <li>Cliquez sur "Partager" en haut à droite</li>
              <li>Changez l'accès en "Visible par toute personne ayant le lien"</li>
              <li>Copiez l'URL ou l'ID de la feuille ci-dessous</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="sheet-input">URL ou ID de la feuille Google Sheets</Label>
          <Input
            id="sheet-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/VOTRE_ID/edit ou directement l'ID"
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !input.trim()}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⊚</span>
                Chargement...
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Charger la feuille
              </>
            )}
          </Button>
          
          <Button 
            onClick={testUserSheet}
            variant="outline"
            size="sm"
          >
            Test ID utilisateur
          </Button>

          <Button 
            onClick={goToSettings}
            variant="outline"
            size="sm"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {debugInfo && (
          <Alert>
            <AlertDescription>
              <strong>Debug:</strong><br/>
              <pre className="text-xs mt-1 whitespace-pre-wrap">{debugInfo}</pre>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• L'URL ressemble à : https://docs.google.com/spreadsheets/d/1ABC...xyz/edit</p>
          <p>• L'ID est la partie entre /d/ et /edit</p>
          <p>• Votre ID: 1uawoG2RorJDRrWtdLHEe9AD7sIoRWmp9h_vAAtr5vVI</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SheetIdInput;
