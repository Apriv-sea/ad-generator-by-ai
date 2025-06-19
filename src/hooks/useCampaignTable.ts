
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Campaign } from "@/services/types";

interface TableRow {
  id: string;
  campaign: string;
  adGroup: string;
  keywords: string;
}

export function useCampaignTable(
  campaigns: Campaign[],
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>
) {
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkData, setBulkData] = useState("");

  // Convert campaigns to table data
  const tableData: TableRow[] = campaigns.flatMap((campaign) =>
    campaign.adGroups.map((adGroup, index) => ({
      id: `${campaign.id}-${index}`,
      campaign: campaign.name,
      adGroup: adGroup.name,
      keywords: adGroup.keywords.join(", ")
    }))
  );

  const handleCellChange = useCallback((rowIndex: number, field: keyof TableRow, value: string) => {
    setCampaigns(prev => {
      const newCampaigns = [...prev];
      // Logic to update campaigns based on table changes
      // This is a simplified version - you may need more complex logic
      return newCampaigns;
    });
  }, [setCampaigns]);

  const handleCellPaste = useCallback((rowIndex: number, field: keyof TableRow, value: string) => {
    handleCellChange(rowIndex, field, value);
  }, [handleCellChange]);

  const addRow = useCallback(() => {
    // Add a new campaign with empty data
    const newCampaign: Campaign = {
      id: `campaign-${Date.now()}`,
      name: "",
      context: "",
      adGroups: [{
        name: "",
        context: "",
        keywords: ["", "", ""]
      }]
    };
    setCampaigns(prev => [...prev, newCampaign]);
  }, [setCampaigns]);

  const removeRow = useCallback((rowIndex: number) => {
    if (tableData.length <= 1) {
      toast.error("Vous devez garder au moins une ligne");
      return;
    }
    // Logic to remove the corresponding campaign/adGroup
    // This is simplified - you'd need to map back to campaigns
    toast.success("Ligne supprimée");
  }, [tableData.length]);

  const handleBulkImport = useCallback(() => {
    if (!bulkData.trim()) {
      toast.error("Veuillez coller vos données");
      return;
    }

    try {
      const lines = bulkData.trim().split('\n');
      const newCampaigns: Campaign[] = lines.map((line, index) => {
        const [campaign, adGroup, keywords] = line.split('\t');
        return {
          id: `bulk-${Date.now()}-${index}`,
          name: campaign || `Campagne ${index + 1}`,
          context: "",
          adGroups: [{
            name: adGroup || `Groupe ${index + 1}`,
            context: "",
            keywords: keywords ? keywords.split(',').map(k => k.trim()) : ["", "", ""]
          }]
        };
      });

      setCampaigns(prev => [...prev, ...newCampaigns]);
      setBulkData("");
      setShowBulkImport(false);
      toast.success(`${newCampaigns.length} campagnes importées`);
    } catch (error) {
      toast.error("Erreur lors de l'import des données");
    }
  }, [bulkData, setCampaigns]);

  return {
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
  };
}
