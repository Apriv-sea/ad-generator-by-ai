
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet } from "@/services/googleSheetsService";
import ClientInfoCard from "./campaign/ClientInfoCard";
import LoadingState from "./campaign/LoadingState";
import EmptyState from "./campaign/EmptyState";
import ContentGenerator from "./campaign/ContentGenerator";
import SpreadsheetSaver from "./campaign/SpreadsheetSaver";
import { useSheetData } from "@/hooks/useSheetData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Campaign } from "@/services/types";
import { campaignExtractorService } from "@/services/storage/campaignExtractorService";

interface CampaignManagerProps {
  sheet: Sheet | null;
  onUpdateComplete: () => void;
}

const CampaignManager: React.FC<CampaignManagerProps> = ({ sheet, onUpdateComplete }) => {
  const { clientInfo, isLoading, sheetData, setSheetData } = useSheetData(sheet);
  const [extractedCampaigns, setExtractedCampaigns] = useState<Campaign[]>([]);

  // Extract campaigns from sheet data when data changes
  useEffect(() => {
    if (sheetData && sheet) {
      const campaigns = campaignExtractorService.extractCampaigns({
        id: sheet.id,
        content: sheetData,
        headers: sheetData[0] || [],
        lastModified: new Date().toISOString(),
        clientInfo: clientInfo
      });
      setExtractedCampaigns(campaigns);
    }
  }, [sheetData, sheet, clientInfo]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!sheet) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <ClientInfoCard clientInfo={clientInfo} campaigns={extractedCampaigns} />

      <Tabs defaultValue="spreadsheet" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="spreadsheet">Google Sheets</TabsTrigger>
          <TabsTrigger value="content">Génération de contenu</TabsTrigger>
        </TabsList>
        
        <TabsContent value="spreadsheet" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Tableur Google Sheets</h2>
              <SpreadsheetSaver 
                sheet={sheet}
                sheetData={sheetData}
                setSheetData={setSheetData}
                onUpdateComplete={onUpdateComplete}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="content" className="space-y-4">
          <ContentGenerator 
            sheet={sheet}
            clientInfo={clientInfo}
            sheetData={sheetData}
            setSheetData={setSheetData}
            onUpdateComplete={onUpdateComplete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignManager;
