
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";

// Type pour les clients
interface Client {
  id: string;
  name: string;
  businessContext: string;
  specifics: string;
  editorialGuidelines: string;
}

const Clients = () => {
  // État pour les clients (simulé pour l'instant)
  const [clients, setClients] = useState<Client[]>([]);
  
  // État pour le nouveau client
  const [newClient, setNewClient] = useState<Omit<Client, 'id'>>({
    name: "",
    businessContext: "",
    specifics: "",
    editorialGuidelines: "",
  });
  
  // Fonction pour ajouter un nouveau client
  const handleAddClient = () => {
    if (!newClient.name) {
      toast.error("Le nom du client est requis");
      return;
    }
    
    const client: Client = {
      id: Date.now().toString(),
      ...newClient,
    };
    
    setClients([...clients, client]);
    setNewClient({
      name: "",
      businessContext: "",
      specifics: "",
      editorialGuidelines: "",
    });
    
    toast.success("Client ajouté avec succès");
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Mes clients</h1>
        
        <div className="flex justify-end mb-4">
          <Dialog>
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
                <Button onClick={handleAddClient}>Ajouter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {clients.length === 0 ? (
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
                  <CardDescription>Client #{client.id.substring(0, 6)}</CardDescription>
                </CardHeader>
                <CardContent>
                  {client.businessContext && (
                    <div className="mb-2">
                      <p className="font-semibold">Contexte métier:</p>
                      <p className="text-sm">{client.businessContext.substring(0, 100)}...</p>
                    </div>
                  )}
                  <div className="mt-4 flex space-x-2">
                    <Button variant="outline" onClick={() => console.log("Éditer", client.id)}>
                      Éditer
                    </Button>
                    <Button onClick={() => console.log("Campagnes", client.id)}>
                      Voir les campagnes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Clients;
