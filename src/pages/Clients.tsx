
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Target, FileText } from "lucide-react";
import ClientsList from "@/components/clients/ClientsList";
import AddClientDialog from "@/components/clients/AddClientDialog";
import { getClients, addClient, updateClient, deleteClient } from "@/services/clientService";
import { Client } from "@/services/types";
import { useToast } from "@/hooks/use-toast";

const Clients = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    businessContext: '',
    specifics: '',
    editorialGuidelines: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const result = await getClients();
      if (result.error) {
        throw result.error;
      }
      setClients(result.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des clients:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientChange = (field: string, value: string) => {
    setNewClient(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddClient = async () => {
    if (!newClient.name?.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du client est requis.",
        variant: "destructive",
      });
      return;
    }

    try {
      const clientId = await addClient(newClient as Client);
      if (!clientId) {
        throw new Error("Impossible de créer le client");
      }
      
      toast({
        title: "Succès",
        description: "Client ajouté avec succès.",
      });
      
      setNewClient({
        name: '',
        businessContext: '',
        specifics: '',
        editorialGuidelines: ''
      });
      setIsAddDialogOpen(false);
      loadClients();
    } catch (error) {
      console.error("Erreur lors de l'ajout du client:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le client.",
        variant: "destructive",
      });
    }
  };

  const handleEditClient = async (client: Client) => {
    // TODO: Implémenter la logique d'édition
    console.log("Édition du client:", client);
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le client "${clientName}" ?`)) {
      return;
    }

    try {
      const success = await deleteClient(clientId);
      if (!success) {
        throw new Error("Impossible de supprimer le client");
      }
      
      toast({
        title: "Succès",
        description: "Client supprimé avec succès.",
      });
      
      loadClients();
    } catch (error) {
      console.error("Erreur lors de la suppression du client:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le client.",
        variant: "destructive",
      });
    }
  };

  const navigateToCampaigns = (clientId: string) => {
    navigate(`/campaigns?client=${clientId}`);
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Gestion des Clients</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Créez des profils clients pour personnaliser vos campagnes
          </p>
          <Button size="lg" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Nouveau client
          </Button>
        </div>

        <div className="grid gap-8">
          <ClientsList 
            clients={clients}
            isLoading={isLoading}
            onEdit={handleEditClient}
            onDelete={handleDeleteClient}
            navigateToCampaigns={navigateToCampaigns}
          />
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center p-6">
              <Users className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Contexte Métier</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Définissez le secteur et les spécificités de chaque client
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <Target className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Objectifs Ciblés</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Adaptez la génération selon les buts marketing
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <FileText className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Ton Éditorial</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Respectez les guidelines de communication
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AddClientDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        newClient={newClient}
        onClientChange={handleClientChange}
        onAddClient={handleAddClient}
      />
    </>
  );
};

export default Clients;
