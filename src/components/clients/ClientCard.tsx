
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { Client } from "@/services/types";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (clientId: string, name: string) => void;
  navigateToCampaigns: (clientId: string) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onEdit,
  onDelete,
  navigateToCampaigns,
}) => {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{client.name}</CardTitle>
        <CardDescription>ID: {client.id.substring(0, 8)}...</CardDescription>
      </CardHeader>
      <CardContent>
        {client.businessContext && (
          <div className="mb-2">
            <p className="font-semibold">Contexte métier:</p>
            <p className="text-sm">
              {client.businessContext.length > 100
                ? `${client.businessContext.substring(0, 100)}...`
                : client.businessContext}
            </p>
          </div>
        )}
        <div className="mt-4 flex space-x-2">
          <Button variant="outline" onClick={() => onEdit(client)}>
            <Edit className="h-4 w-4 mr-2" />
            Éditer
          </Button>
          <Button onClick={() => navigateToCampaigns(client.id)}>
            Voir les campagnes
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action supprimera définitivement le client "{client.name}" et toutes ses campagnes associées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(client.id, client.name)}>
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientCard;
