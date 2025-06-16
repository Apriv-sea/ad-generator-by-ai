
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/services/googleSheetsService";
import SheetsList from "@/components/SheetsList";
import CreateSheetDialog from "@/components/CreateSheetDialog";
import { RefreshCw } from "lucide-react";

interface SheetsTabProps {
  sheets: Sheet[];
  isLoading: boolean;
  onSelectSheet: (sheet: Sheet) => void;
  onDeleteSheet: (sheetId: string) => void;
  onSheetCreated: () => void;
  onRefreshSheets: () => void;
}

const SheetsTab: React.FC<SheetsTabProps> = ({
  sheets,
  isLoading,
  onSelectSheet,
  onDeleteSheet,
  onSheetCreated,
  onRefreshSheets
}) => {
  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Gestion des feuilles</CardTitle>
          <CardDescription>
            Créez une nouvelle feuille ou sélectionnez une feuille existante
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <CreateSheetDialog onSheetCreated={onSheetCreated} />
          <Button 
            variant="outline" 
            onClick={onRefreshSheets}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? "Chargement..." : "Rafraîchir la liste"}
          </Button>
        </CardContent>
      </Card>
      
      <SheetsList 
        sheets={sheets} 
        onSelectSheet={onSelectSheet}
        onDeleteSheet={onDeleteSheet}
        isLoading={isLoading} 
      />
    </>
  );
};

export default SheetsTab;
