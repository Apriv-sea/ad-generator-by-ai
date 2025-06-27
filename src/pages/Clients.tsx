
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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

  // Charger les clients au montage du composant
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
      const result = await addClient(newClient as Client);
      if (result.error) {
        throw result.error;
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
      const result = await deleteClient(clientId);
      if (result.error) {
        throw result.error;
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
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Clients</h1>
            <p className="text-gray-600">
              Gérez vos clients et personnalisez le contenu généré
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau client
          </Button>
        </div>

        <div className="grid gap-6">
          <ClientsList 
            clients={clients}
            isLoading={isLoading}
            onEdit={handleEditClient}
            onDelete={handleDeleteClient}
            navigateToCampaigns={navigateToCampaigns}
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Pourquoi créer des profils clients ?</CardTitle>
              <CardDescription>
                Personnalisez vos campagnes selon chaque contexte métier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm"><strong>Contexte métier :</strong> Adaptez le vocabulaire au secteur d'activité</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm"><strong>Objectifs ciblés :</strong> Orientez la génération selon les buts marketing</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm"><strong>Ton éditorial :</strong> Respectez les guidelines de communication</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
