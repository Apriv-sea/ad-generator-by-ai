
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash } from "lucide-react";
import KeywordsInput from "./KeywordsInput";
import { AdGroup } from "@/services/googleSheetsService";

interface AdGroupFormProps {
  adGroup: AdGroup;
  onNameChange: (name: string) => void;
  onContextChange: (context: string) => void;
  onKeywordChange: (keywordIndex: number, value: string) => void;
  onRemove: () => void;
  removable: boolean;
}

const AdGroupForm: React.FC<AdGroupFormProps> = ({
  adGroup,
  onNameChange,
  onContextChange,
  onKeywordChange,
  onRemove,
  removable
}) => {
  return (
    <div className="border border-dashed rounded-md p-3 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-grow">
          <Label htmlFor="adgroup-name">
            Nom du Groupe d'Annonces
          </Label>
          <Input
            id="adgroup-name"
            value={adGroup.name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Nom du groupe d'annonces"
            className="mt-1"
          />
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRemove}
          className="ml-2"
          disabled={!removable}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
      
      <div>
        <Label htmlFor="adgroup-context">
          Contexte du Groupe d'Annonces
        </Label>
        <Textarea
          id="adgroup-context"
          value={adGroup.context}
          onChange={(e) => onContextChange(e.target.value)}
          placeholder="Spécificités de ce groupe, offres particulières..."
          className="mt-1 min-h-16"
        />
      </div>
      
      <KeywordsInput 
        keywords={adGroup.keywords} 
        onChange={onKeywordChange}
      />
    </div>
  );
};

export default AdGroupForm;
