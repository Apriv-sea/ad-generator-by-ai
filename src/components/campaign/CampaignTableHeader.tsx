
import React from "react";
import { Button } from "@/components/ui/button";
import { ClipboardPaste, Plus } from "lucide-react";

interface CampaignTableHeaderProps {
  onAddRow: () => void;
  onToggleBulkImport: () => void;
}

const CampaignTableHeader: React.FC<CampaignTableHeaderProps> = ({
  onAddRow,
  onToggleBulkImport
}) => {
  return (
    <div className="p-2 flex justify-between border-b">
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleBulkImport}
        >
          <ClipboardPaste className="h-4 w-4 mr-1" /> Importation multiple
        </Button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddRow}
      >
        <Plus className="h-4 w-4 mr-1" /> Ajouter une ligne
      </Button>
    </div>
  );
};

export default CampaignTableHeader;
