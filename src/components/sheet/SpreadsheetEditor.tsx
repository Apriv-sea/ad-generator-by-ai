
import React, { useState, useEffect, useRef } from "react";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Save } from "lucide-react";
import { toast } from "sonner";

// Enregistrer tous les modules Handsontable
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

  useEffect(() => {
    setTableData(data || []);
  }, [data]);

  const handleSave = () => {
    if (!hotTableRef.current) return;
    
    const instance = hotTableRef.current.hotInstance;
    const currentData = instance.getData();
    
    onSave(currentData);
    setIsDirty(false);
    toast.success("Données sauvegardées avec succès");
  };

  const handleAfterChange = () => {
    setIsDirty(true);
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-muted p-2 flex justify-between items-center">
        <h3 className="font-medium text-sm">Éditeur de feuille</h3>
        <Button 
          size="sm" 
          onClick={handleSave} 
          disabled={!isDirty || readOnly}
        >
          <Save className="h-4 w-4 mr-1" />
          Enregistrer
        </Button>
      </div>
      <CardContent className="p-0 overflow-x-auto">
        <div style={{ height: '500px', width: '100%' }}>
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
            contextMenu={!readOnly}
            comments={!readOnly}
            readOnly={readOnly}
            afterChange={handleAfterChange}
            columnSorting={true}
            filters={true}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SpreadsheetEditor;
