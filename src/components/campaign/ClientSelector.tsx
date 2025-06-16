
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client } from "@/services/types";
import { getClientShortInfo } from "@/services/clientService";
import { toast } from "sonner";
import { Users } from "lucide-react";

interface ClientSelectorProps {
  selectedClientId?: string;
  onClientSelect: (client: Client | null) => void;
  showCreateOption?: boolean;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({
  selectedClientId,
  onClientSelect,
  showCreateOption = true
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const clientsList = await getClientShortInfo();
      setClients(clientsList);
    } catch (error) {
      console.error("Erreur lors du chargement des clients:", error);
      toast.error("Impossible de charger les clients");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientChange = (clientId: string) => {
    if (clientId === "none") {
      onClientSelect(null);
      return;
    }

    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      onClientSelect(selectedClient);
      toast.success(`Client "${selectedClient.name}" sélectionné`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Sélection du client
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select
            value={selectedClientId || "none"}
            onValueChange={handleClientChange}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir un client..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun client sélectionné</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                  {client.businessContext && (
                    <span className="text-sm text-muted-foreground ml-2">
                      - {client.businessContext.substring(0, 50)}...
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showCreateOption && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Pas de client approprié ?
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/clients', '_blank')}
              >
                Créer un nouveau client
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientSelector;
