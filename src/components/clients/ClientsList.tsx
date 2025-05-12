
import React from "react";
import { Client } from "@/services/types";
import ClientCard from "./ClientCard";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ClientsListProps {
  clients: Client[];
  isLoading: boolean;
  onEdit: (client: Client) => void;
  onDelete: (clientId: string, name: string) => void;
  navigateToCampaigns: (clientId: string) => void;
}

const ClientsList: React.FC<ClientsListProps> = ({
  clients,
  isLoading,
  onEdit,
  onDelete,
  navigateToCampaigns,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des clients...</span>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <Card className="text-center p-8">
        <CardContent>
          <p className="mb-4">Vous n'avez pas encore de clients.</p>
          <p>Ajoutez votre premier client pour commencer à générer du contenu.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {clients.map((client) => (
        <ClientCard
          key={client.id}
          client={client}
          onEdit={onEdit}
          onDelete={onDelete}
          navigateToCampaigns={navigateToCampaigns}
        />
      ))}
    </div>
  );
};

export default ClientsList;
