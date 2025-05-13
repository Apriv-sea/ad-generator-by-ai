
import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface BulkImportPanelProps {
  bulkData: string;
  setBulkData: React.Dispatch<React.SetStateAction<string>>;
  onImport: () => void;
  onCancel: () => void;
}

const BulkImportPanel: React.FC<BulkImportPanelProps> = ({ 
  bulkData, 
  setBulkData, 
  onImport, 
  onCancel 
}) => {
  return (
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
          onClick={onCancel}
        >
          Annuler
        </Button>
        <Button
          size="sm"
          onClick={onImport}
        >
          Importer
        </Button>
      </div>
    </div>
  );
};

export default BulkImportPanel;
