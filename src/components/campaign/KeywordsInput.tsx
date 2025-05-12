
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface KeywordsInputProps {
  keywords: string[];
  onChange: (index: number, value: string) => void;
}

/**
 * Component for inputting and editing keywords.
 * 
 * @param keywords - Array of keywords strings to display
 * @param onChange - Callback function when a keyword changes
 */
const KeywordsInput: React.FC<KeywordsInputProps> = ({ keywords, onChange }) => {
  return (
    <div>
      <Label>Top 3 mots-clés</Label>
      <div className="grid grid-cols-3 gap-2 mt-1">
        {[0, 1, 2].map((keywordIndex) => (
          <Input
            key={`keyword-${keywordIndex}`}
            value={keywords[keywordIndex] || ""}
            onChange={(e) => onChange(keywordIndex, e.target.value)}
            placeholder={`Mot-clé ${keywordIndex + 1}`}
            aria-label={`Mot-clé ${keywordIndex + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default KeywordsInput;
