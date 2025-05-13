
import React, { useState, useEffect, useRef } from "react";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Save, FileSpreadsheet, Plus } from "lucide-react";
import { toast } from "sonner";

// Enregistrer tous les modules pour avoir accès à toutes les fonctionnalités
registerAllModules();

// Nombre de lignes à ajouter par lot
const ROWS_INCREMENT = 1000;
const DEFAULT_ROWS = 1000;

interface SpreadsheetEditorProps {
  data: any[][];
  sheetId: string;
  onSave: (data: any[][]) => void;
  readOnly?: boolean;
}

const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({
  data,
  sheetId,
  onSave,
  readOnly = false
}) => {
  const [tableData, setTableData] = useState<any[][]>(data || []);
  const hotTableRef = useRef<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [totalRows, setTotalRows] = useState(DEFAULT_ROWS);

  // Mettre à jour les données du tableau lorsque les données externes changent
  useEffect(() => {
    if (data && data.length > 0) {
      // Conserver les données existantes mais s'assurer qu'il y a au moins DEFAULT_ROWS lignes
      const dataLength = data.length;
      if (dataLength < DEFAULT_ROWS) {
        const defaultHeaders = data[0];
        const moreEmptyRows = Array(DEFAULT_ROWS - dataLength).fill(Array(defaultHeaders.length).fill(''));
        const newData = [...data, ...moreEmptyRows];
        setTableData(newData);
        setTotalRows(DEFAULT_ROWS);
      } else {
        setTableData(data);
        setTotalRows(data.length);
      }
      setIsDirty(false);
    } else {
      // Si aucune donnée n'est fournie, créer une grille vide avec les en-têtes
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
      
      const emptyRows = Array(DEFAULT_ROWS).fill(Array(defaultHeaders.length).fill(''));
      const newData = [defaultHeaders, ...emptyRows];
      setTableData(newData);
      setTotalRows(DEFAULT_ROWS);
    }
  }, [data]);

  const handleSave = () => {
    if (!hotTableRef.current) {
      toast.error("Impossible d'accéder au tableur");
      return;
    }
    
    try {
      const instance = hotTableRef.current.hotInstance;
      const currentData = instance.getData();
      
      onSave(currentData);
      setIsDirty(false);
      toast.success("Données sauvegardées avec succès");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde du tableur");
    }
  };

  const handleAfterChange = () => {
    setIsDirty(true);
  };

  const addMoreRows = () => {
    if (!hotTableRef.current) {
      toast.error("Impossible d'accéder au tableur");
      return;
    }

    try {
      const instance = hotTableRef.current.hotInstance;
      const columnsCount = instance.countCols();
      
      // Ajouter 1000 lignes vides supplémentaires
      const emptyRows = Array(ROWS_INCREMENT).fill(Array(columnsCount).fill(''));
      const newTotalRows = totalRows + ROWS_INCREMENT;
      
      // Utiliser l'API Handsontable pour ajouter des lignes
      instance.alter('insert_row_below', totalRows - 1, ROWS_INCREMENT);
      
      setTotalRows(newTotalRows);
      toast.success(`${ROWS_INCREMENT} lignes supplémentaires ajoutées`);
    } catch (error) {
      console.error("Erreur lors de l'ajout de lignes:", error);
      toast.error("Impossible d'ajouter des lignes supplémentaires");
    }
  };

  return (
    <Card className="overflow-hidden border-none shadow-lg">
      <div className="bg-primary/5 p-3 flex justify-between items-center">
        <div className="flex items-center">
          <FileSpreadsheet className="h-5 w-5 mr-2 text-primary" />
          <h3 className="font-medium">Éditeur de feuille</h3>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={addMoreRows}
            disabled={readOnly}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Ajouter 1000 lignes
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
      <CardContent className="p-0">
        <div className="h-[700px] w-full overflow-hidden">
          <HotTable
            ref={hotTableRef}
            data={tableData}
            rowHeaders={true}
            colHeaders={true}
            width="100%"
            height="100%"
            licenseKey="non-commercial-and-evaluation"
            stretchH="all"
            autoColumnSize={true}
            manualColumnResize={true}
            manualRowResize={true}
            contextMenu={!readOnly && {
              items: {
                'row_above': {}, 
                'row_below': {},
                'col_left': {},
                'col_right': {},
                'remove_row': {},
                'remove_col': {},
                'separator': '---------',
                'copy': {},
                'cut': {}
              }
            }}
            comments={!readOnly}
            readOnly={readOnly}
            afterChange={handleAfterChange}
            columnSorting={true}
            filters={true}
            dropdownMenu={true}
            fixedRowsTop={1}
            wordWrap={true}
            className="hot-improved"
            mergeCells={true}
            allowEmpty={true}
            fillHandle={true}
            outsideClickDeselects={false}
            cells={(row, col) => {
              // Vérifier que row est un nombre entier positif
              if (typeof row !== 'number' || row < 0 || !Number.isInteger(row)) {
                return {};
              }
              
              const cellProperties = {};
              
              if (row === 0) {
                // Style pour l'en-tête
                Object.assign(cellProperties, { 
                  className: 'header-cell',
                  readOnly: true
                });
              }
              
              return cellProperties;
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SpreadsheetEditor;
