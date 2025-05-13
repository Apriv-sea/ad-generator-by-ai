
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/services/googleSheetsService";
import { FileSpreadsheet, ExternalLink, Trash } from "lucide-react";
import { toast } from "sonner";

interface SheetsListProps {
  sheets: Sheet[];
  onSelectSheet: (sheet: Sheet) => void;
  onDeleteSheet: (sheetId: string) => void;
  isLoading: boolean;
}

const SheetsList: React.FC<SheetsListProps> = ({ 
  sheets, 
  onSelectSheet, 
  onDeleteSheet,
  isLoading 
}) => {
  const handleDeleteSheet = (sheetId: string, sheetName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Êtes-vous sûr de vouloir supprimer la feuille "${sheetName}" ?`)) {
      onDeleteSheet(sheetId);
      toast.success(`Feuille "${sheetName}" supprimée avec succès`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-8">
            <div className="text-center">
              <p className="mb-2">Chargement de vos feuilles...</p>
              <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mx-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sheets.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucune feuille trouvée.
              <br />
              Créez une nouvelle feuille pour commencer.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom de la feuille</TableHead>
              <TableHead>Dernière modification</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sheets.map((sheet) => (
              <TableRow key={sheet.id}>
                <TableCell className="font-medium">{sheet.name}</TableCell>
                <TableCell>
                  {new Date(sheet.lastModified).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectSheet(sheet)}
                    >
                      Sélectionner
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:bg-red-50"
                      onClick={(e) => handleDeleteSheet(sheet.id, sheet.name, e)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SheetsList;
