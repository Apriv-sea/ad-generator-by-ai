
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Sheet } from "@/services/types";
import GoogleSheetsIdInput from './GoogleSheetsIdInput';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, History } from "lucide-react";
import { googleSheetsPersistenceService } from "@/services/storage/googleSheetsPersistenceService";

interface GoogleSheetsEmbedProps {
  sheetUrl?: string;
  onSheetUrlChange: (url: string) => void;
  sheet?: Sheet;
  onConnectionSuccess?: (sheetId: string) => void;
}

const GoogleSheetsEmbed: React.FC<GoogleSheetsEmbedProps> = ({
  sheetUrl,
  onSheetUrlChange,
  sheet,
  onConnectionSuccess
}) => {
  const [sheetData, setSheetData] = useState<any>(null);
  const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [showRecentSessions, setShowRecentSessions] = useState(false);

  useEffect(() => {
    // Charger les sessions récentes au montage
    const sessions = googleSheetsPersistenceService.getSessions();
    setRecentSessions(sessions.slice(0, 5)); // Les 5 plus récentes
    setShowRecentSessions(sessions.length > 0 && !sheetData);
  }, [sheetData]);

  const handleSheetLoaded = (sheetId: string, data: any) => {
    console.log("Feuille chargée dans GoogleSheetsEmbed:", sheetId);
    setSheetData(data);
    setCurrentSheetId(sheetId);
    setShowRecentSessions(false);
    onSheetUrlChange(`https://docs.google.com/spreadsheets/d/${sheetId}/edit`);
    toast.success("Feuille Google Sheets connectée avec succès");
    
    // Appeler le callback de connexion réussie avec le sheetId
    if (onConnectionSuccess) {
      onConnectionSuccess(sheetId);
    }
  };

  const handleConnectionSuccess = () => {
    console.log("Gestion de la connexion réussie...");
    if (onConnectionSuccess && currentSheetId) {
      onConnectionSuccess(currentSheetId);
    }
  };

  const handleRestoreSession = async (session: any) => {
    try {
      console.log("Restauration de la session:", session);
      
      // Simuler la connexion avec les données de la session
      const mockData = {
        values: session.dataPreview?.sampleData || [session.dataPreview?.headers || []],
        title: session.name
      };
      
      handleSheetLoaded(session.sheetId, mockData);
      toast.success(`Session "${session.name}" restaurée`);
    } catch (error) {
      console.error("Erreur lors de la restauration:", error);
      toast.error("Impossible de restaurer la session");
    }
  };

  const openInNewTab = () => {
    if (currentSheetId) {
      window.open(`https://docs.google.com/spreadsheets/d/${currentSheetId}/edit`, '_blank');
    }
  };

  // Affichage des sessions récentes
  if (showRecentSessions && recentSessions.length > 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <History className="h-5 w-5 mr-2 text-blue-600" />
              <h3 className="text-lg font-semibold">Sessions récentes</h3>
            </div>
            
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRestoreSession(session)}
                >
                  <div>
                    <p className="font-medium">{session.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(session.lastConnected).toLocaleDateString()} • 
                      {session.dataPreview?.rowCount || 0} lignes
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Restaurer
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowRecentSessions(false)}
                className="w-full"
              >
                Nouvelle connexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affichage de la nouvelle connexion
  if (!sheetData) {
    return (
      <div className="space-y-4">
        {recentSessions.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <Button 
                variant="outline" 
                onClick={() => setShowRecentSessions(true)}
                className="w-full"
              >
                <History className="h-4 w-4 mr-2" />
                Voir les sessions récentes ({recentSessions.length})
              </Button>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardContent className="p-6">
            <GoogleSheetsIdInput 
              onSheetLoaded={handleSheetLoaded}
              onConnectionSuccess={handleConnectionSuccess}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affichage des données connectées
  const headers = sheetData.values?.[0] || [];
  const rows = sheetData.values?.slice(1) || [];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{sheetData.info?.title || sheetData.title || 'Feuille Google Sheets'}</h3>
              <p className="text-sm text-muted-foreground">
                {rows.length} lignes de données • {headers.length} colonnes
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir dans Google Sheets
              </Button>
            </div>
          </div>

          <div className="max-h-96 overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header: string, index: number) => (
                    <TableHead key={index} className="whitespace-nowrap">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 10).map((row: string[], index: number) => (
                  <TableRow key={index}>
                    {headers.map((_, cellIndex: number) => (
                      <TableCell key={cellIndex} className="whitespace-nowrap">
                        {row[cellIndex] || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {rows.length > 10 && (
            <p className="text-xs text-muted-foreground text-center">
              ... et {rows.length - 10} autres lignes
            </p>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setSheetData(null);
                setCurrentSheetId(null);
                setShowRecentSessions(true);
              }}
            >
              Changer de feuille
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsEmbed;
