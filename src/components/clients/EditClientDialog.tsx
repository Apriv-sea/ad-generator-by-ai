
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

interface EditClientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingClient: Client | null;
  onClientChange: (field: string, value: string) => void;
  onUpdateClient: () => void;
}

const EditClientDialog: React.FC<EditClientDialogProps> = ({
  isOpen,
  onOpenChange,
  editingClient,
  onClientChange,
  onUpdateClient,
}) => {
  if (!editingClient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
          <DialogDescription>
            Modifiez les informations du client
          </DialogDescription>
        </DialogHeader>
        
        <ClientForm
          client={editingClient}
          isEditing={true}
          onChange={onClientChange}
          onSubmit={onUpdateClient}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditClientDialog;
