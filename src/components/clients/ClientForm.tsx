
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Brain, Sparkles } from "lucide-react";
import { Client } from "@/services/types";
import { ClientContextAssistant } from "./ClientContextAssistant";
import IndustrySelector from "./IndustrySelector";
import { EditorialConstraintsForm } from "./EditorialConstraintsForm";
import { EditorialConstraints } from "@/services/content/editorialConstraintsService";

interface ClientFormProps {
  client: Partial<Client>;
  isEditing: boolean;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({
  client,
  isEditing,
  onChange,
  onSubmit,
  onCancel,
}) => {
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [website, setWebsite] = useState("");
  
  const handleConstraintsChange = (constraints: EditorialConstraints) => {
    onChange("forbiddenTerms", JSON.stringify(constraints.forbiddenTerms));
    onChange("forbiddenPhrases", JSON.stringify(constraints.forbiddenPhrases));
    onChange("forbiddenTones", JSON.stringify(constraints.forbiddenTones));
    onChange("mandatoryTerms", JSON.stringify(constraints.mandatoryTerms));
    onChange("constraintPriority", constraints.constraintPriority);
  };

  const handleContextGenerated = (generatedContext: any) => {
    // Appliquer le contexte généré aux champs du formulaire
    onChange("businessContext", generatedContext.businessContext);
    onChange("editorialGuidelines", generatedContext.editorialGuidelines);
    onChange("industry", generatedContext.industry || "");
    onChange("targetPersona", generatedContext.targetAudience || "");
    onChange("specifics", `Secteur: ${generatedContext.industry}\nTon: ${generatedContext.toneOfVoice}\nCible: ${generatedContext.targetAudience}\nValeurs: ${generatedContext.brandValues.join(', ')}`);
    
    setShowAIAssistant(false);
  };

  const handleIndustryChange = (industry: string) => {
    onChange("industry", industry);
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="client-name">Nom du client</Label>
        <Input
          id="client-name"
          placeholder="Nom de l'entreprise"
          value={client.name || ""}
          onChange={(e) => onChange("name", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Site web (optionnel)</Label>
        <div className="flex gap-2">
          <Input
            id="website"
            type="url"
            placeholder="https://www.exemple.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAIAssistant(true)}
            disabled={!client.name || !website}
            className="shrink-0"
          >
            <Brain className="h-4 w-4 mr-1" />
            Assistant IA
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Renseignez le site web pour utiliser l'assistant de contexte IA
        </p>
      </div>

      {showAIAssistant && (
        <>
          <Separator />
          <ClientContextAssistant
            onContextGenerated={handleContextGenerated}
            initialData={{ name: client.name, website }}
          />
          <Separator />
        </>
      )}

      {/* Sélecteur de secteur intelligent */}
      <IndustrySelector
        selectedIndustry={client.industry}
        onIndustryChange={handleIndustryChange}
        businessContext={client.businessContext || ""}
        clientName={client.name || ""}
        showPromptPreview={true}
        required={true}
      />

      <div className="space-y-2">
        <Label htmlFor="target-persona" className="flex items-center gap-2">
          Public cible / Persona
          {showAIAssistant && <Sparkles className="h-4 w-4 text-blue-500" />}
        </Label>
        <Input
          id="target-persona"
          placeholder="Ex: PME, Particuliers 25-45 ans, Dirigeants..."
          value={client.targetPersona || ""}
          onChange={(e) => onChange("targetPersona", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="business-context" className="flex items-center gap-2">
          Contexte métier
          {showAIAssistant && <Sparkles className="h-4 w-4 text-blue-500" />}
        </Label>
        <Textarea
          id="business-context"
          placeholder="Décrivez le positionnement, la mission et les objectifs du client"
          value={client.businessContext || ""}
          onChange={(e) => onChange("businessContext", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="specifics" className="flex items-center gap-2">
          Spécificités
          {showAIAssistant && <Sparkles className="h-4 w-4 text-blue-500" />}
        </Label>
        <Textarea
          id="specifics"
          placeholder="Points forts, USP, avantages concurrentiels..."
          value={client.specifics || ""}
          onChange={(e) => onChange("specifics", e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="guidelines" className="flex items-center gap-2">
          Charte éditoriale
          {showAIAssistant && <Sparkles className="h-4 w-4 text-blue-500" />}
        </Label>
        <Textarea
          id="guidelines"
          placeholder="Style, ton, mots à utiliser ou éviter..."
          value={client.editorialGuidelines || ""}
          onChange={(e) => onChange("editorialGuidelines", e.target.value)}
          rows={3}
        />
      </div>

      <Separator />
      
      {/* Contraintes éditoriales */}
      <EditorialConstraintsForm
        initialConstraints={{
          forbiddenTerms: client.forbiddenTerms || [],
          forbiddenPhrases: client.forbiddenPhrases || [],
          forbiddenTones: client.forbiddenTones || [],
          mandatoryTerms: client.mandatoryTerms || [],
          constraintPriority: client.constraintPriority || 'high'
        }}
        onConstraintsChange={handleConstraintsChange}
        industry={client.industry}
        editorialGuidelines={client.editorialGuidelines}
      />

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button 
          onClick={onSubmit}
          disabled={!client.name || !client.industry || !client.businessContext}
        >
          {isEditing ? "Enregistrer" : "Ajouter"}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default ClientForm;
