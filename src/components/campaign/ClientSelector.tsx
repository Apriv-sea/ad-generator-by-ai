import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client } from "@/services/types";
import { getClientShortInfo } from "@/services/clientService";
import { toast } from "sonner";
import { Users } from "lucide-react";

interface ModernClientSelectorProps {
  selectedClientId?: string;
  onClientSelect: (client: Client | null) => void;
  showCreateOption?: boolean;
}

interface LegacyClientSelectorProps {
  clients: Client[];
  selectedClient: string | null;
  onClientSelect: (clientId: string, client?: Client) => void;
  isLoading?: boolean;
  className?: string;
}

type ClientSelectorProps = ModernClientSelectorProps | LegacyClientSelectorProps;

const ClientSelector: React.FC<ClientSelectorProps> = (props) => {
  // Détection du format utilisé
  const isLegacyFormat = 'clients' in props;
  
  if (isLegacyFormat) {
    return <LegacyClientSelector {...props} />;
  }
  
  return <ModernClientSelector {...props} />;
};

const ModernClientSelector: React.FC<ModernClientSelectorProps> = ({
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

const LegacyClientSelector: React.FC<LegacyClientSelectorProps> = ({ 
  clients, 
  selectedClient, 
  onClientSelect, 
  isLoading = false, 
  className 
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
        onValueChange={(value) => {
          const selectedClientObj = clients.find(client => client.id === value);
          onClientSelect(value, selectedClientObj);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Sélectionnez un client" />
        </SelectTrigger>
        <SelectContent>
          {clients.map((client: Client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ClientSelector;