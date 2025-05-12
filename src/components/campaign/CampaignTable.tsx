
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash, ClipboardPaste } from "lucide-react";
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
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkData, setBulkData] = useState("");

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

  const handleBulkImport = () => {
    if (!bulkData.trim()) {
      toast.error("Veuillez entrer des données à importer");
      return;
    }

    try {
      // Analyser les données collées (format: campagne, groupe d'annonces, mots-clés)
      const lines = bulkData.split('\n').filter(line => line.trim());
      
      const newRows: TableRow[] = lines.map((line, index) => {
        const parts = line.split('\t');
        return {
          id: `bulk-${index}`,
          campaignName: parts[0] || "",
          adGroupName: parts[1] || "",
          keywords: parts[2] || ""
        };
      });

      if (newRows.length === 0) {
        toast.error("Aucune donnée valide à importer");
        return;
      }

      // Remplacer les données du tableau
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

  // Gestionnaire de coller pour les cellules individuelles
  const handleCellPaste = (e: React.ClipboardEvent, rowIndex: number, field: keyof TableRow) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    if (!pastedText.includes('\n')) {
      // Collage simple pour une seule cellule
      handleCellChange(rowIndex, field, pastedText);
      return;
    }
    
    // Si on détecte plusieurs lignes, suggérer l'importation en bloc
    toast.info("Utilisez l'option d'importation en bloc pour coller plusieurs lignes", {
      action: {
        label: "Importer",
        onClick: () => setShowBulkImport(true)
      }
    });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="p-2 flex justify-between border-b">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkImport(!showBulkImport)}
          >
            <ClipboardPaste className="h-4 w-4 mr-1" /> Importation multiple
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={addRow}
        >
          <Plus className="h-4 w-4 mr-1" /> Ajouter une ligne
        </Button>
      </div>

      {showBulkImport && (
        <div className="p-4 border-b bg-muted/30">
          <p className="text-sm mb-2">
            Collez vos données au format tableur (colonnes séparées par des tabulations):
            <br />
            <span className="text-xs text-muted-foreground">Nom de campagne [Tab] Nom du groupe d'annonces [Tab] Mots-clés (séparés par des virgules)</span>
          </p>
          <Textarea
            value={bulkData}
            onChange={(e) => setBulkData(e.target.value)}
            placeholder="Campagne1&#9;Groupe1&#9;mot-clé1, mot-clé2, mot-clé3"
            className="font-mono text-sm mb-2 min-h-[150px]"
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowBulkImport(false);
                setBulkData("");
              }}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleBulkImport}
            >
              Importer
            </Button>
          </div>
        </div>
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
              <TableRow key={row.id}>
                <TableCell>
                  <Input
                    value={row.campaignName}
                    onChange={(e) => handleCellChange(index, 'campaignName', e.target.value)}
                    onPaste={(e) => handleCellPaste(e, index, 'campaignName')}
                    placeholder="Nom de la campagne"
                    className="min-w-[200px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.adGroupName}
                    onChange={(e) => handleCellChange(index, 'adGroupName', e.target.value)}
                    onPaste={(e) => handleCellPaste(e, index, 'adGroupName')}
                    placeholder="Nom du groupe d'annonces"
                    className="min-w-[200px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.keywords}
                    onChange={(e) => handleCellChange(index, 'keywords', e.target.value)}
                    onPaste={(e) => handleCellPaste(e, index, 'keywords')}
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
    </div>
  );
};

export default CampaignTable;
