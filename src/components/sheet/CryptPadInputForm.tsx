
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CryptPadInputFormProps {
  input: string;
  onInputChange: (value: string) => void;
}

const CryptPadInputForm: React.FC<CryptPadInputFormProps> = ({ input, onInputChange }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="cryptpad-input">URL ou ID de la feuille CryptPad</Label>
      <Input
        id="cryptpad-input"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="https://cryptpad.fr/sheet/#/2/sheet/edit/VOTRE_ID ou directement l'ID"
      />
    </div>
  );
};

export default CryptPadInputForm;
