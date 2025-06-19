
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Sheet } from "@/services/googleSheetsService";
import SheetIdInput from './SheetIdInput';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink } from "lucide-react";

interface GoogleSheetsEmbedProps {
  sheetUrl?: string;
  onSheetUrlChange: (url: string) => void;
  sheet?: Sheet;
}

const GoogleSheetsEmbed: React.FC<GoogleSheetsEmbedProps> = ({
  sheetUrl,
  onSheetUrlChange,
  sheet
}) => {
  const [sheetData, setSheetData] = useState<any>(null);
  const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);

  const handleSheetLoaded = (sheetId: string, data: any) => {
    setSheetData(data);
    setCurrentSheetId(sheetId);
    onSheetUrlChange(`https://docs.google.com/spreadsheets/d/${sheetId}/edit`);
    toast.success("Feuille connectée avec succès");
  };

  const openInNewTab = () => {
    if (currentSheetId) {
      window.open(`https://docs.google.com/spreadsheets/d/${currentSheetId}/edit`, '_blank');
    }
  };

  if (!sheetData) {
    return (
      <Card>
        <CardContent className="p-6">
          <SheetIdInput onSheetLoaded={handleSheetLoaded} />
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
              <h3 className="text-lg font-semibold">{sheetData.info?.title || 'Feuille Google Sheets'}</h3>
              <p className="text-sm text-muted-foreground">
                {rows.length} lignes de données • {headers.length} colonnes
              </p>
            </div>
            
            <Button variant="outline" size="sm" onClick={openInNewTab}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir dans Google Sheets
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
              setCurrentSheetId(null);
            }}
          >
            Changer de feuille
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsEmbed;
