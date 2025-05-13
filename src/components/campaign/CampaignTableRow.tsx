
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";

interface CampaignTableRowProps {
  row: {
    id: string;
    campaignName: string;
    adGroupName: string;
    keywords: string;
  };
  index: number;
  onCellChange: (rowIndex: number, field: string, value: string) => void;
  onCellPaste: (e: React.ClipboardEvent, rowIndex: number, field: string) => void;
  onRemove: (index: number) => void;
}

const CampaignTableRow: React.FC<CampaignTableRowProps> = ({
  row,
  index,
  onCellChange,
  onCellPaste,
  onRemove
}) => {
  return (
    <TableRow>
      <TableCell>
        <Input
          value={row.campaignName}
          onChange={(e) => onCellChange(index, 'campaignName', e.target.value)}
          onPaste={(e) => onCellPaste(e, index, 'campaignName')}
          placeholder="Nom de la campagne"
          className="min-w-[200px]"
        />
      </TableCell>
      <TableCell>
        <Input
          value={row.adGroupName}
          onChange={(e) => onCellChange(index, 'adGroupName', e.target.value)}
          onPaste={(e) => onCellPaste(e, index, 'adGroupName')}
          placeholder="Nom du groupe d'annonces"
          className="min-w-[200px]"
        />
      </TableCell>
      <TableCell>
        <Input
          value={row.keywords}
          onChange={(e) => onCellChange(index, 'keywords', e.target.value)}
          onPaste={(e) => onCellPaste(e, index, 'keywords')}
          placeholder="mot-clé1, mot-clé2, mot-clé3"
          className="min-w-[300px]"
        />
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default CampaignTableRow;
