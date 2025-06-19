
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Campaign } from "@/services/types";
import { useCampaignTable } from "@/hooks/useCampaignTable";
import CampaignTableHeader from "./CampaignTableHeader";
import CampaignTableRow from "./CampaignTableRow";
import BulkImportPanel from "./BulkImportPanel";
import { toast } from "sonner";

interface CampaignTableProps {
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
}

const CampaignTable: React.FC<CampaignTableProps> = ({ campaigns, setCampaigns }) => {
  const {
    tableData,
    showBulkImport,
    setShowBulkImport,
    bulkData,
    setBulkData,
    handleCellChange,
    handleCellPaste,
    addRow,
    removeRow,
    handleBulkImport
  } = useCampaignTable(campaigns, setCampaigns);

  return (
    <div className="border rounded-lg overflow-hidden">
      <CampaignTableHeader 
        onAddRow={addRow}
        onToggleBulkImport={() => setShowBulkImport(!showBulkImport)} 
      />

      {showBulkImport && (
        <BulkImportPanel
          bulkData={bulkData}
          setBulkData={setBulkData}
          onImport={handleBulkImport}
          onCancel={() => {
            setShowBulkImport(false);
            setBulkData("");
          }}
        />
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom de la campagne</TableHead>
              <TableHead>Nom du groupe d'annonces</TableHead>
              <TableHead>Top 3 mots-clés (séparés par des virgules)</TableHead>
              <TableHead className="w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row, index) => (
              <CampaignTableRow
                key={row.id}
                row={row}
                index={index}
                onCellChange={handleCellChange}
                onCellPaste={handleCellPaste}
                onRemove={removeRow}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CampaignTable;
