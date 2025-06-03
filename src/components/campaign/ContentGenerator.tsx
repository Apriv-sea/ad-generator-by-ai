
import React from "react";
import { Sheet, Client } from "@/services/googleSheetsService";
import { Card, CardContent } from "@/components/ui/card";
import CampaignExtractor from "./CampaignExtractor";
import ContentGeneratorHeader from "./ContentGeneratorHeader";
import ContentGenerationForm from "./ContentGenerationForm";
import { useContentGeneration } from "./ContentGenerationLogic";

interface ContentGeneratorProps {
  sheet: Sheet;
  clientInfo: Client | null;
  sheetData: any[][] | null;
  setSheetData: React.Dispatch<React.SetStateAction<any[][] | null>>;
  onUpdateComplete: () => void;
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({
  sheet, 
  clientInfo, 
  sheetData,
  setSheetData,
  onUpdateComplete
}) => {
  const {
    isSaving,
    selectedModel,
    setSelectedModel,
    generateContent
  } = useContentGeneration({
    sheet,
    clientInfo,
    sheetData,
    setSheetData,
    onUpdateComplete
  });

  return (
    <div className="space-y-6">
      <CampaignExtractor 
        sheet={sheet}
        sheetData={sheetData}
        onUpdateComplete={onUpdateComplete}
      />

      <Card>
        <ContentGeneratorHeader />
        <CardContent className="space-y-4">
          <ContentGenerationForm
            selectedModel={selectedModel}
            onModelSelect={setSelectedModel}
            onGenerate={generateContent}
            isSaving={isSaving}
            clientInfo={clientInfo}
            sheetData={sheetData}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentGenerator;
