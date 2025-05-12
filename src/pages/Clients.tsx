
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Client } from "@/services/types";
import { getClients } from "@/services/clientQuery";
import { addClient, updateClient, deleteClient } from "@/services/clientService";
import ClientsList from "@/components/clients/ClientsList";
import AddClientDialog from "@/components/clients/AddClientDialog";
import EditClientDialog from "@/components/clients/EditClientDialog";

const Clients = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // State for clients
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for new client
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: "",
    businessContext: "",
    specifics: "",
    editorialGuidelines: "",
  });
  
  // State for editing a client
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  
  // Redirect to login page if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);
  
  // Load clients when page loads
  useEffect(() => {
    if (isAuthenticated) {
      loadClients();
    }
  }, [isAuthenticated]);
  
  const loadClients = async () => {
    setIsLoading(true);
    try {
      const response = await getClients();
      if (response.data) {
        setClients(response.data as unknown as Client[]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des clients:", error);
      toast.error("Impossible de charger les clients");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to add a new client
  const handleAddClient = async () => {
    if (!newClient.name) {
      toast.error("Le nom du client est requis");
      return;
    }
    
    try {
      const clientId = await addClient(newClient);
      if (clientId) {
        // Create a new client object with the generated ID
        const addedClient: Client = {
          id: clientId,
          name: newClient.name || "",
          businessContext: newClient.businessContext,
          specifics: newClient.specifics,
          editorialGuidelines: newClient.editorialGuidelines,
        };
        setClients([...clients, addedClient]);
        setNewClient({
          name: "",
          businessContext: "",
          specifics: "",
          editorialGuidelines: "",
        });
        setIsNewDialogOpen(false);
        toast.success("Client ajouté avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du client:", error);
      toast.error("Impossible d'ajouter le client");
    }
  };
  
  // Function to update a client
  const handleUpdateClient = async () => {
    if (!editingClient || !editingClient.name) {
      toast.error("Le nom du client est requis");
      return;
    }
    
    try {
      // Extract necessary fields for update
      const { id } = editingClient;
      
      const success = await updateClient(id, editingClient);
      if (success) {
        setClients(clients.map(c => c.id === editingClient.id ? editingClient : c));
        setIsEditDialogOpen(false);
        toast.success("Client mis à jour avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du client:", error);
      toast.error("Impossible de mettre à jour le client");
    }
  };
  
  // Function to delete a client
  const handleDeleteClient = async (clientId: string, name: string) => {
    try {
      const success = await deleteClient(clientId);
      if (success) {
        setClients(clients.filter(c => c.id !== clientId));
        toast.success("Client supprimé avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du client:", error);
      toast.error("Impossible de supprimer le client");
    }
  };
  
  // Function to open edit dialog
  const openEditDialog = (client: Client) => {
    setEditingClient({...client});
    setIsEditDialogOpen(true);
  };
  
  // Function to navigate to client campaigns
  const navigateToCampaigns = (clientId: string) => {
    navigate(`/campaigns?client=${clientId}`);
  };
  
  // Handle change for new client form
  const handleNewClientChange = (field: string, value: string) => {
    setNewClient(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle change for edit client form
  const handleEditingClientChange = (field: string, value: string) => {
    if (editingClient) {
      setEditingClient(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  if (!isAuthenticated) {
    return null; // Don't show anything while redirecting
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Mes clients</h1>
        
        <div className="flex justify-end mb-4">
          <AddClientDialog
            isOpen={isNewDialogOpen}
            onOpenChange={setIsNewDialogOpen}
            newClient={newClient}
            onClientChange={handleNewClientChange}
            onAddClient={handleAddClient}
          />
        </div>
        
        <ClientsList
          clients={clients}
          isLoading={isLoading}
          onEdit={openEditDialog}
          onDelete={handleDeleteClient}
          navigateToCampaigns={navigateToCampaigns}
        />
      </div>
      
      <EditClientDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingClient={editingClient}
        onClientChange={handleEditingClientChange}
        onUpdateClient={handleUpdateClient}
      />
    </>
  );
};

export default Clients;
