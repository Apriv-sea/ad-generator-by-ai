
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet } from "@/services/googleSheetsService";
import SheetsTab from "./SheetsTab";
import EditorTab from "./EditorTab";

interface CampaignsTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  selectedSheet: Sheet | null;
  sheets: Sheet[];
  isLoading: boolean;
  onSelectSheet: (sheet: Sheet) => void;
  onDeleteSheet: (sheetId: string) => void;
  onSheetCreated: () => void;
  onRefreshSheets: () => void;
  onUpdateComplete: () => void;
}

const CampaignsTabs: React.FC<CampaignsTabsProps> = ({
  activeTab,
  onTabChange,
  selectedSheet,
  sheets,
  isLoading,
  onSelectSheet,
  onDeleteSheet,
  onSheetCreated,
  onRefreshSheets,
  onUpdateComplete
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="mb-8">
      <TabsList className="mb-6">
        <TabsTrigger value="sheets">Feuilles</TabsTrigger>
        <TabsTrigger value="editor" disabled={!selectedSheet}>
          Éditeur de Campagnes
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="sheets">
        <SheetsTab
          sheets={sheets}
          isLoading={isLoading}
          onSelectSheet={onSelectSheet}
          onDeleteSheet={onDeleteSheet}
          onSheetCreated={onSheetCreated}
          onRefreshSheets={onRefreshSheets}
        />
      </TabsContent>
      
      <TabsContent value="editor">
        <EditorTab
          selectedSheet={selectedSheet}
          onUpdateComplete={onUpdateComplete}
          onBackToSheets={() => onTabChange("sheets")}
        />
      </TabsContent>
    </Tabs>
  );
};

export default CampaignsTabs;
