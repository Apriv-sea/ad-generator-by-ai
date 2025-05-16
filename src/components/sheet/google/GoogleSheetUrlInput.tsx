
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface GoogleSheetUrlInputProps {
  inputUrl: string;
  onInputChange: (url: string) => void;
  onSubmit: () => void;
}

const GoogleSheetUrlInput: React.FC<GoogleSheetUrlInputProps> = ({
  inputUrl,
  onInputChange,
  onSubmit
}) => {
  return (
    <div className="flex gap-2">
      <Input
        value={inputUrl}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="Coller l'URL d'une feuille Google Sheets"
        className="flex-1"
      />
      <Button onClick={onSubmit}>
        <Save className="h-4 w-4 mr-2" />
        Intégrer
      </Button>
    </div>
  );
};

export default GoogleSheetUrlInput;
