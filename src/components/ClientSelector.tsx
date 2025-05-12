
import React from "react";
import { Client } from "@/services/googleSheetsService";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientSelectorProps {
  clients: Client[];
  selectedClient: string | null;
  onClientSelect: (clientId: string) => void;
  isLoading?: boolean;
  className?: string;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({
  clients,
  selectedClient,
  onClientSelect,
  isLoading = false,
  className,
}) => {
  if (isLoading) {
    return (
      <div className={className}>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Chargement des clients..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className={className}>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Aucun client disponible" />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className={className}>
      <Select
        value={selectedClient || ""}
        onValueChange={(value) => onClientSelect(value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Sélectionnez un client" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Clients</SelectLabel>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ClientSelector;
