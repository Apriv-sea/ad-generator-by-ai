
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/services/googleSheetsService";
import CampaignManager from "@/components/CampaignManager";
import { FileSpreadsheet } from "lucide-react";

interface EditorTabProps {
  selectedSheet: Sheet | null;
  onUpdateComplete: () => void;
  onBackToSheets: () => void;
}

const EditorTab: React.FC<EditorTabProps> = ({
  selectedSheet,
  onUpdateComplete,
  onBackToSheets
}) => {
  if (!selectedSheet) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p>Aucune feuille sélectionnée. Veuillez retourner à l'onglet Feuilles pour en sélectionner une.</p>
          <Button 
            onClick={onBackToSheets} 
            className="mt-4"
          >
            Voir les feuilles disponibles
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            {selectedSheet.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            Dernière modification: {new Date(selectedSheet.lastModified).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={onBackToSheets}
        >
          Retour aux Feuilles
        </Button>
      </div>
      
      <CampaignManager 
        sheet={selectedSheet} 
        onUpdateComplete={onUpdateComplete} 
      />
    </>
  );
};

export default EditorTab;
