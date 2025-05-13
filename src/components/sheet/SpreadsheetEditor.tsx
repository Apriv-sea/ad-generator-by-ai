
import React, { useState, useEffect, useRef } from "react";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Save, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

// Enregistrer tous les modules pour avoir accès à toutes les fonctionnalités
registerAllModules();

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

  // Mettre à jour les données du tableau lorsque les données externes changent
  useEffect(() => {
    if (data && data.length > 0) {
      setTableData(data);
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
      
      const emptyRows = Array(10).fill(Array(defaultHeaders.length).fill(''));
      const newData = [defaultHeaders, ...emptyRows];
      setTableData(newData);
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

  return (
    <Card className="overflow-hidden border-none shadow-lg">
      <div className="bg-primary/5 p-3 flex justify-between items-center">
        <div className="flex items-center">
          <FileSpreadsheet className="h-5 w-5 mr-2 text-primary" />
          <h3 className="font-medium">Éditeur de feuille</h3>
        </div>
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
            cell={[
              { row: 0, col: -1, className: 'header-cell', readOnly: true }
            ]}
            cells={(row, col) => {
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
