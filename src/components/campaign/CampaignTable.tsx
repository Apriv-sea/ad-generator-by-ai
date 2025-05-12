
import React, { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import { toast } from "sonner";
import { Campaign, AdGroup } from "@/services/googleSheetsService";

interface CampaignTableProps {
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
}

interface TableRow {
  id: string;
  campaignName: string;
  adGroupName: string;
  keywords: string;
}

const CampaignTable: React.FC<CampaignTableProps> = ({ campaigns, setCampaigns }) => {
  const [tableData, setTableData] = useState<TableRow[]>([]);

  // Convertir les campagnes en données de tableau
  useEffect(() => {
    const rows: TableRow[] = [];
    campaigns.forEach((campaign, campaignIndex) => {
      campaign.adGroups.forEach((adGroup, adGroupIndex) => {
        rows.push({
          id: `${campaignIndex}-${adGroupIndex}`,
          campaignName: campaign.name,
          adGroupName: adGroup.name,
          keywords: adGroup.keywords.filter(k => k.trim()).join(", ")
        });
      });
    });
    
    // S'assurer qu'il y a au moins une ligne vide si aucune donnée
    if (rows.length === 0) {
      rows.push({
        id: "0-0",
        campaignName: "",
        adGroupName: "",
        keywords: ""
      });
    }
    
    setTableData(rows);
  }, [campaigns]);

  // Mettre à jour les campagnes depuis les données du tableau
  const updateCampaigns = (updatedTableData: TableRow[]) => {
    const campaignMap = new Map<string, any>();
    
    updatedTableData.forEach((row) => {
      if (!row.campaignName.trim()) return;
      
      if (!campaignMap.has(row.campaignName)) {
        campaignMap.set(row.campaignName, {
          name: row.campaignName,
          context: "",
          adGroups: []
        });
      }
      
      if (!row.adGroupName.trim()) return;
      
      const campaign = campaignMap.get(row.campaignName);
      const existingAdGroup = campaign.adGroups.find(
        (ag: AdGroup) => ag.name === row.adGroupName
      );
      
      if (!existingAdGroup) {
        const keywords = row.keywords 
          ? row.keywords.split(",").map(k => k.trim()).filter(k => k)
          : [];
        
        campaign.adGroups.push({
          name: row.adGroupName,
          keywords: keywords.length > 0 ? keywords : [""],
          context: ""
        });
      }
    });
    
    const updatedCampaigns = Array.from(campaignMap.values());
    if (updatedCampaigns.length === 0) {
      // Créer une campagne vide par défaut
      updatedCampaigns.push({
        name: "",
        context: "",
        adGroups: [{
          name: "",
          keywords: ["", "", ""],
          context: ""
        }]
      });
    }
    
    setCampaigns(updatedCampaigns);
  };

  const handleCellChange = (rowIndex: number, field: keyof TableRow, value: string) => {
    const updatedData = [...tableData];
    updatedData[rowIndex][field] = value;
    setTableData(updatedData);
    
    // Mettre à jour les campagnes
    updateCampaigns(updatedData);
  };

  const addRow = () => {
    // Trouver la dernière campagne et groupe d'annonce pour les suggestions
    const lastRow = tableData[tableData.length - 1];
    const newRow: TableRow = {
      id: `new-${tableData.length}`,
      campaignName: lastRow?.campaignName || "",
      adGroupName: "",
      keywords: ""
    };
    
    setTableData([...tableData, newRow]);
  };

  const removeRow = (index: number) => {
    if (tableData.length <= 1) {
      toast.info("Vous devez conserver au moins une ligne");
      return;
    }
    
    const updatedData = [...tableData];
    updatedData.splice(index, 1);
    setTableData(updatedData);
    
    // Mettre à jour les campagnes
    updateCampaigns(updatedData);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
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
              <TableRow key={row.id}>
                <TableCell>
                  <Input
                    value={row.campaignName}
                    onChange={(e) => handleCellChange(index, 'campaignName', e.target.value)}
                    placeholder="Nom de la campagne"
                    className="min-w-[200px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.adGroupName}
                    onChange={(e) => handleCellChange(index, 'adGroupName', e.target.value)}
                    placeholder="Nom du groupe d'annonces"
                    className="min-w-[200px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.keywords}
                    onChange={(e) => handleCellChange(index, 'keywords', e.target.value)}
                    placeholder="mot-clé1, mot-clé2, mot-clé3"
                    className="min-w-[300px]"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="p-2 flex justify-center border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={addRow}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" /> Ajouter une ligne
        </Button>
      </div>
    </div>
  );
};

export default CampaignTable;
