
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface CampaignsHeaderProps {
  onBackToTemplate: () => void;
}

const CampaignsHeader: React.FC<CampaignsHeaderProps> = ({ onBackToTemplate }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold">Campagnes publicitaires</h1>
      <Button 
        variant="outline" 
        onClick={onBackToTemplate}
        className="text-sm"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Utiliser le template
      </Button>
    </div>
  );
};

export default CampaignsHeader;
