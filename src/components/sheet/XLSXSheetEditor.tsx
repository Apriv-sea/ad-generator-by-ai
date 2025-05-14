
import React, { useState, useEffect, useRef } from "react";
import { utils, writeFile, read } from "xlsx";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Save, FileSpreadsheet, Download, Upload, Plus, Trash } from "lucide-react";

interface XLSXSheetEditorProps {
  initialData: any[][];
  onSave: (data: any[][]) => void;
  readOnly?: boolean;
}

const XLSXSheetEditor: React.FC<XLSXSheetEditorProps> = ({
  initialData,
  onSave,
  readOnly = false
}) => {
  // État pour stocker les données du tableur
  const [data, setData] = useState<any[][]>(initialData || []);
  const [isDirty, setIsDirty] = useState(false);
  
  // Référence pour l'entrée de fichier
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mettre à jour les données lorsque les données externes changent
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setData(initialData);
      setIsDirty(false);
    } else {
      // Créer des en-têtes par défaut si aucune donnée n'est fournie
      const defaultHeaders = [
        "Nom de la campagne",
        "Nom du groupe d'annonces",
        "Top 3 mots-clés",
        "Titre 1",
        "Titre 2",
        "Titre 3",
        "Description 1",
        "Description 2",
      ];
      
      setData([defaultHeaders, Array(defaultHeaders.length).fill('')]);
    }
  }, [initialData]);

  // Gérer la modification d'une cellule
  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...data];
    
    // S'assurer que la ligne existe
    if (!newData[rowIndex]) {
      newData[rowIndex] = [];
    }
    
    newData[rowIndex][colIndex] = value;
    setData(newData);
    setIsDirty(true);
  };

  // Gérer la sauvegarde des données
  const handleSave = () => {
    try {
      onSave(data);
      setIsDirty(false);
      toast.success("Données sauvegardées avec succès");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  // Exporter les données au format Excel
  const handleExport = () => {
    try {
      // Créer un classeur
      const ws = utils.aoa_to_sheet(data);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Campagnes");
      
      // Générer le fichier Excel
      writeFile(wb, "campagnes.xlsx");
      toast.success("Fichier Excel exporté avec succès");
    } catch (error) {
      console.error("Erreur lors de l'exportation:", error);
      toast.error("Erreur lors de l'exportation du fichier Excel");
    }
  };

  // Importer des données depuis un fichier Excel/CSV
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result) return;
        
        // Lire le fichier Excel/CSV
        const workbook = read(result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir en tableau
        const importedData = utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        
        // Mettre à jour les données
        setData(importedData);
        setIsDirty(true);
        toast.success("Données importées avec succès");
      } catch (error) {
        console.error("Erreur lors de l'importation:", error);
        toast.error("Erreur lors de l'importation du fichier");
      }
    };
    
    reader.onerror = () => {
      toast.error("Erreur lors de la lecture du fichier");
    };
    
    reader.readAsBinaryString(file);
    
    // Réinitialiser l'entrée de fichier pour permettre l'importation du même fichier plusieurs fois
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Ajouter une nouvelle ligne
  const handleAddRow = () => {
    const newData = [...data];
    const columnCount = newData[0]?.length || 0;
    newData.push(Array(columnCount).fill(''));
    setData(newData);
    setIsDirty(true);
  };

  // Supprimer une ligne
  const handleDeleteRow = (rowIndex: number) => {
    // Ne pas supprimer l'en-tête ou la dernière ligne
    if (rowIndex === 0 || data.length <= 2) return;
    
    const newData = [...data];
    newData.splice(rowIndex, 1);
    setData(newData);
    setIsDirty(true);
  };

  return (
    <Card className="overflow-hidden border-none shadow-lg">
      <div className="bg-primary/5 p-3 flex justify-between items-center">
        <div className="flex items-center">
          <FileSpreadsheet className="h-5 w-5 mr-2 text-primary" />
          <h3 className="font-medium">Éditeur de feuille</h3>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={readOnly}
          />
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={readOnly}
            className="gap-1"
          >
            <Upload className="h-4 w-4" />
            Importer
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleExport}
            className="gap-1"
          >
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleAddRow}
            disabled={readOnly}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Ajouter une ligne
          </Button>
          
          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={!isDirty || readOnly}
            className="gap-1"
          >
            <Save className="h-4 w-4" />
            Enregistrer
          </Button>
        </div>
      </div>
      <CardContent className="p-0 overflow-x-auto">
        <div className="max-h-[700px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {data[0]?.map((header: string, colIndex: number) => (
                  <TableHead key={`header-${colIndex}`} className="min-w-[150px] sticky top-0 bg-background z-10">
                    {readOnly ? header : (
                      <Input
                        value={header}
                        onChange={(e) => handleCellChange(0, colIndex, e.target.value)}
                        className="font-medium"
                      />
                    )}
                  </TableHead>
                ))}
                {!readOnly && <TableHead className="sticky top-0 bg-background w-[50px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(1).map((row: any[], rowIndex: number) => (
                <TableRow key={`row-${rowIndex + 1}`}>
                  {row.map((cell: any, colIndex: number) => (
                    <TableCell key={`cell-${rowIndex + 1}-${colIndex}`} className="min-w-[150px]">
                      {readOnly ? cell : (
                        <Input
                          value={cell || ''}
                          onChange={(e) => handleCellChange(rowIndex + 1, colIndex, e.target.value)}
                        />
                      )}
                    </TableCell>
                  ))}
                  {!readOnly && (
                    <TableCell className="w-[50px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRow(rowIndex + 1)}
                        title="Supprimer cette ligne"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default XLSXSheetEditor;
