
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Client } from "@/services/types";
import { getClients, clientService } from "@/services/clientService";
import { Loader2, Edit, Trash } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

const Clients = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // État pour les clients
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // État pour le nouveau client
  const [newClient, setNewClient] = useState<Omit<Client, 'id'>>({
    name: "",
    businessContext: "",
    specifics: "",
    editorialGuidelines: "",
  });
  
  // État pour l'édition d'un client
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  
  // Rediriger vers la page de connexion si non authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);
  
  // Charger les clients au chargement de la page
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
  
  // Fonction pour ajouter un nouveau client
  const handleAddClient = async () => {
    if (!newClient.name) {
      toast.error("Le nom du client est requis");
      return;
    }
    
    try {
      const clientId = await clientService.addClient(newClient);
      if (clientId) {
        // Créer un nouvel objet client avec l'ID généré
        const addedClient: Client = {
          id: clientId,
          name: newClient.name,
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
  
  // Fonction pour mettre à jour un client
  const handleUpdateClient = async () => {
    if (!editingClient || !editingClient.name) {
      toast.error("Le nom du client est requis");
      return;
    }
    
    try {
      // Extraire les champs nécessaires pour la mise à jour
      const { id, name, businessContext, specifics, editorialGuidelines } = editingClient;
      const updates = { name, businessContext, specifics, editorialGuidelines };
      
      const success = await clientService.updateClient(id, updates);
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
  
  // Fonction pour supprimer un client
  const handleDeleteClient = async (clientId: string, name: string) => {
    try {
      const success = await clientService.deleteClient(clientId, name);
      if (success) {
        setClients(clients.filter(c => c.id !== clientId));
        toast.success("Client supprimé avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du client:", error);
      toast.error("Impossible de supprimer le client");
    }
  };
  
  // Fonction pour ouvrir le dialogue d'édition
  const openEditDialog = (client: Client) => {
    setEditingClient({...client});
    setIsEditDialogOpen(true);
  };
  
  // Fonction pour naviguer vers les campagnes du client
  const navigateToCampaigns = (clientId: string) => {
    navigate(`/campaigns?client=${clientId}`);
  };

  if (!isAuthenticated) {
    return null; // Ne rien afficher pendant la redirection
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Mes clients</h1>
        
        <div className="flex justify-end mb-4">
          <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
            <DialogTrigger asChild>
              <Button>Ajouter un client</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau client</DialogTitle>
                <DialogDescription>
                  Remplissez les informations du client pour personnaliser la génération de contenu
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name">Nom du client</Label>
                  <Input
                    id="client-name"
                    placeholder="Nom de l'entreprise"
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business-context">Contexte métier</Label>
                  <Textarea
                    id="business-context"
                    placeholder="Décrivez le secteur d'activité et le positionnement du client"
                    value={newClient.businessContext}
                    onChange={(e) => setNewClient({...newClient, businessContext: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="specifics">Spécificités</Label>
                  <Textarea
                    id="specifics"
                    placeholder="Points forts, USP, avantages concurrentiels..."
                    value={newClient.specifics}
                    onChange={(e) => setNewClient({...newClient, specifics: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="guidelines">Charte éditoriale</Label>
                  <Textarea
                    id="guidelines"
                    placeholder="Style, ton, mots à utiliser ou éviter..."
                    value={newClient.editorialGuidelines}
                    onChange={(e) => setNewClient({...newClient, editorialGuidelines: e.target.value})}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleAddClient}>Ajouter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Chargement des clients...</span>
          </div>
        ) : clients.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent>
              <p className="mb-4">Vous n'avez pas encore de clients.</p>
              <p>Ajoutez votre premier client pour commencer à générer du contenu.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clients.map((client) => (
              <Card key={client.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{client.name}</CardTitle>
                  <CardDescription>ID: {client.id.substring(0, 8)}...</CardDescription>
                </CardHeader>
                <CardContent>
                  {client.businessContext && (
                    <div className="mb-2">
                      <p className="font-semibold">Contexte métier:</p>
                      <p className="text-sm">{client.businessContext.length > 100 
                        ? `${client.businessContext.substring(0, 100)}...` 
                        : client.businessContext}</p>
                    </div>
                  )}
                  <div className="mt-4 flex space-x-2">
                    <Button variant="outline" onClick={() => openEditDialog(client)}>
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
                          <AlertDialogAction onClick={() => handleDeleteClient(client.id)}>
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Dialogue d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
            <DialogDescription>
              Modifiez les informations du client
            </DialogDescription>
          </DialogHeader>
          
          {editingClient && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-client-name">Nom du client</Label>
                <Input
                  id="edit-client-name"
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-business-context">Contexte métier</Label>
                <Textarea
                  id="edit-business-context"
                  value={editingClient.businessContext}
                  onChange={(e) => setEditingClient({...editingClient, businessContext: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-specifics">Spécificités</Label>
                <Textarea
                  id="edit-specifics"
                  value={editingClient.specifics}
                  onChange={(e) => setEditingClient({...editingClient, specifics: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-guidelines">Charte éditoriale</Label>
                <Textarea
                  id="edit-guidelines"
                  value={editingClient.editorialGuidelines}
                  onChange={(e) => setEditingClient({...editingClient, editorialGuidelines: e.target.value})}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleUpdateClient}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Clients;
