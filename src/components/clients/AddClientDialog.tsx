
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ClientForm from "./ClientForm";
import { Client } from "@/services/types";

interface AddClientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newClient: Partial<Client>;
  onClientChange: (field: string, value: string) => void;
  onAddClient: () => void;
}

const AddClientDialog: React.FC<AddClientDialogProps> = ({
  isOpen,
  onOpenChange,
  newClient,
  onClientChange,
  onAddClient,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Ajouter un nouveau client</DialogTitle>
          <DialogDescription>
            Remplissez les informations du client pour personnaliser la génération de contenu
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 pr-6 -mr-6">
          <ClientForm
            client={newClient}
            isEditing={false}
            onChange={onClientChange}
            onSubmit={onAddClient}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientDialog;
