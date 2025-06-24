import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Sheet } from "@/services/types";
import CryptPadIdInput from './CryptPadIdInput';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink } from "lucide-react";

interface CryptPadEmbedProps {
  sheetUrl?: string;
  onSheetUrlChange: (url: string) => void;
  sheet?: Sheet;
  onConnectionSuccess?: (padId: string) => void;
}

const CryptPadEmbed: React.FC<CryptPadEmbedProps> = ({
  sheetUrl,
  onSheetUrlChange,
  sheet,
  onConnectionSuccess
}) => {
  const [sheetData, setSheetData] = useState<any>(null);
  const [currentPadId, setCurrentPadId] = useState<string | null>(null);

  const handleSheetLoaded = (padId: string, data: any) => {
    console.log("Feuille chargée dans CryptPadEmbed:", padId);
    setSheetData(data);
    setCurrentPadId(padId);
    onSheetUrlChange(`https://cryptpad.fr/sheet/#/2/sheet/edit/${padId}`);
    toast.success("Feuille CryptPad connectée avec succès");
    
    // Appeler le callback de connexion réussie avec le padId
    if (onConnectionSuccess) {
      onConnectionSuccess(padId);
    }
  };

  const handleConnectionSuccess = () => {
    console.log("Gestion de la connexion réussie...");
    if (onConnectionSuccess) {
      onConnectionSuccess(currentPadId);
    }
  };

  const openInNewTab = () => {
    if (currentPadId) {
      window.open(`https://cryptpad.fr/sheet/#/2/sheet/edit/${currentPadId}`, '_blank');
    }
  };

  if (!sheetData) {
    return (
      <Card>
        <CardContent className="p-6">
          <CryptPadIdInput 
            onSheetLoaded={handleSheetLoaded}
            onConnectionSuccess={handleConnectionSuccess}
          />
        </CardContent>
      </Card>
    );
  }

  const headers = sheetData.values?.[0] || [];
  const rows = sheetData.values?.slice(1) || [];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{sheetData.info?.title || 'Feuille CryptPad'}</h3>
              <p className="text-sm text-muted-foreground">
                {rows.length} lignes de données • {headers.length} colonnes
              </p>
            </div>
            
            <Button variant="outline" size="sm" onClick={openInNewTab}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir dans CryptPad
            </Button>
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

          <Button 
            variant="outline" 
            onClick={() => {
              setSheetData(null);
              setCurrentPadId(null);
            }}
          >
            Changer de feuille
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CryptPadEmbed;
