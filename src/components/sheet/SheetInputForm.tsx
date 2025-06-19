
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SheetInputFormProps {
  input: string;
  onInputChange: (value: string) => void;
}

const SheetInputForm: React.FC<SheetInputFormProps> = ({ input, onInputChange }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="sheet-input">URL ou ID de la feuille Google Sheets</Label>
      <Input
        id="sheet-input"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="https://docs.google.com/spreadsheets/d/VOTRE_ID/edit ou directement l'ID"
      />
    </div>
  );
};

export default SheetInputForm;
