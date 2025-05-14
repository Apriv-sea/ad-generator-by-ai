
import { useState, useEffect } from "react";
import { Campaign, AdGroup } from "@/services/googleSheetsService";
import { toast } from "sonner";

interface TableRow {
  id: string;
  campaignName: string;
  adGroupName: string;
  keywords: string;
}

export function useCampaignTable(
  campaigns: Campaign[],
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>
) {
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkData, setBulkData] = useState("");

  // Convert campaigns to table data
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
    
    // Ensure there's at least one empty row if no data
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

  // Update campaigns from table data
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
      // Create default empty campaign
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
    
    // Update campaigns
    updateCampaigns(updatedData);
  };

  const addRow = () => {
    // Find the last campaign and ad group for suggestions
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
    
    // Update campaigns
    updateCampaigns(updatedData);
  };

  const handleBulkImport = () => {
    if (!bulkData.trim()) {
      toast.error("Veuillez entrer des données à importer");
      return;
    }

    try {
      // Parse pasted data (format: campaign, ad group, keywords)
      const lines = bulkData
        .split('\n')
        .filter(line => line.trim());
      
      if (lines.length === 0) {
        toast.error("Aucune donnée valide à importer");
        return;
      }
      
      const newRows: TableRow[] = lines.map((line, index) => {
        const parts = line.split('\t');
        return {
          id: `bulk-${index}`,
          campaignName: parts[0] || "",
          adGroupName: parts[1] || "",
          keywords: parts[2] || ""
        };
      });

      // Replace table data
      setTableData(newRows);
      updateCampaigns(newRows);
      setShowBulkImport(false);
      setBulkData("");
      toast.success(`${newRows.length} lignes importées avec succès`);
    } catch (error) {
      console.error("Erreur d'importation:", error);
      toast.error("Format d'importation invalide");
    }
  };

  // Handle paste for individual cells
  const handleCellPaste = (e: React.ClipboardEvent, rowIndex: number, field: keyof TableRow) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    if (!pastedText.includes('\n') && !pastedText.includes('\t')) {
      // Simple paste for a single cell
      handleCellChange(rowIndex, field, pastedText);
      return;
    }
    
    // Multi-ligne ou multi-colonne détecté
    const lines = pastedText.split('\n').filter(line => line.trim());
    
    if (lines.length > 1 || pastedText.includes('\t')) {
      // Plusieurs lignes ou colonnes détectées, proposer l'importation en bloc
      toast.info("Utilisez l'option d'importation en bloc pour coller plusieurs lignes", {
        action: {
          label: "Importer",
          onClick: () => {
            setShowBulkImport(true);
            setBulkData(pastedText);
          }
        }
      });
      return;
    }
    
    // Fallback au comportement par défaut
    handleCellChange(rowIndex, field, pastedText);
  };

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
