
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Client } from "@/services/types";

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
        <Label htmlFor="business-context">Contexte métier</Label>
        <Textarea
          id="business-context"
          placeholder="Décrivez le secteur d'activité et le positionnement du client"
          value={client.businessContext || ""}
          onChange={(e) => onChange("businessContext", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="specifics">Spécificités</Label>
        <Textarea
          id="specifics"
          placeholder="Points forts, USP, avantages concurrentiels..."
          value={client.specifics || ""}
          onChange={(e) => onChange("specifics", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="guidelines">Charte éditoriale</Label>
        <Textarea
          id="guidelines"
          placeholder="Style, ton, mots à utiliser ou éviter..."
          value={client.editorialGuidelines || ""}
          onChange={(e) => onChange("editorialGuidelines", e.target.value)}
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button onClick={onSubmit}>
          {isEditing ? "Enregistrer" : "Ajouter"}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default ClientForm;
