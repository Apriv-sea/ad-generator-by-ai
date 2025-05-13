
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet } from "@/services/googleSheetsService";
import ClientInfoCard from "./campaign/ClientInfoCard";
import LoadingState from "./campaign/LoadingState";
import EmptyState from "./campaign/EmptyState";
import ContentGenerator from "./campaign/ContentGenerator";
import SpreadsheetSaver from "./campaign/SpreadsheetSaver";
import { useSheetData } from "@/hooks/useSheetData";

interface CampaignManagerProps {
  sheet: Sheet | null;
  onUpdateComplete: () => void;
}

const CampaignManager: React.FC<CampaignManagerProps> = ({ sheet, onUpdateComplete }) => {
  const { clientInfo, isLoading, sheetData, setSheetData } = useSheetData(sheet);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!sheet) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <ClientInfoCard clientInfo={clientInfo} />

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4">Tableur des campagnes</h2>
          <SpreadsheetSaver 
            sheet={sheet}
            sheetData={sheetData}
            setSheetData={setSheetData}
            onUpdateComplete={onUpdateComplete}
          />
        </CardContent>
      </Card>

      <ContentGenerator 
        sheet={sheet}
        clientInfo={clientInfo}
        sheetData={sheetData}
        setSheetData={setSheetData}
        onUpdateComplete={onUpdateComplete}
      />
    </div>
  );
};

export default CampaignManager;
