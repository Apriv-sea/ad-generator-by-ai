
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash, PlusCircle } from "lucide-react";
import AdGroupForm from "./AdGroupForm";
import { Campaign } from "@/services/googleSheetsService";

interface CampaignFormProps {
  campaign: Campaign;
  onCampaignNameChange: (name: string) => void;
  onCampaignContextChange: (context: string) => void;
  onAdGroupNameChange: (adGroupIndex: number, name: string) => void;
  onAdGroupContextChange: (adGroupIndex: number, context: string) => void;
  onKeywordChange: (adGroupIndex: number, keywordIndex: number, value: string) => void;
  onAddAdGroup: () => void;
  onRemoveAdGroup: (adGroupIndex: number) => void;
  onRemoveCampaign: () => void;
  removable: boolean;
}

const CampaignForm: React.FC<CampaignFormProps> = ({
  campaign,
  onCampaignNameChange,
  onCampaignContextChange,
  onAdGroupNameChange,
  onAdGroupContextChange,
  onKeywordChange,
  onAddAdGroup,
  onRemoveAdGroup,
  onRemoveCampaign,
  removable
}) => {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex flex-row justify-between items-start">
        <div className="flex-grow space-y-3">
          <div>
            <Label htmlFor="campaign-name">Nom de la Campagne</Label>
            <Input
              id="campaign-name"
              value={campaign.name}
              onChange={(e) => onCampaignNameChange(e.target.value)}
              placeholder="Nom de la campagne"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="campaign-context">Contexte de la Campagne</Label>
            <Textarea
              id="campaign-context"
              value={campaign.context}
              onChange={(e) => onCampaignContextChange(e.target.value)}
              placeholder="Objectif, positionnement et public cible de cette campagne..."
              className="mt-1 min-h-20"
            />
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRemoveCampaign}
          className="ml-2"
          disabled={!removable}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="pl-3 border-l-2 space-y-4">
        {campaign.adGroups.map((adGroup, adGroupIndex) => (
          <AdGroupForm 
            key={`adgroup-${adGroupIndex}`}
            adGroup={adGroup}
            onNameChange={(name) => onAdGroupNameChange(adGroupIndex, name)}
            onContextChange={(context) => onAdGroupContextChange(adGroupIndex, context)}
            onKeywordChange={(keywordIndex, value) => onKeywordChange(adGroupIndex, keywordIndex, value)}
            onRemove={() => onRemoveAdGroup(adGroupIndex)}
            removable={campaign.adGroups.length > 1}
          />
        ))}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAddAdGroup}
          className="w-full"
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Ajouter un Groupe d'Annonces
        </Button>
      </div>
    </div>
  );
};

export default CampaignForm;
