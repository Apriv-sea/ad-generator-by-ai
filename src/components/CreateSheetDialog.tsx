
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { sheetService, Client } from "@/services/sheetService";
import ClientSelector from "./ClientSelector";
import { getClients } from "@/services/clientQuery";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface CreateSheetDialogProps {
  onSheetCreated: () => void;
}

const CreateSheetDialog: React.FC<CreateSheetDialogProps> = ({ onSheetCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sheetName, setSheetName] = useState("Campagne publicitaire");
  const [isCreating, setIsCreating] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedClientData, setSelectedClientData] = useState<Client | null>(null);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  const loadClients = async () => {
    setIsLoadingClients(true);
    try {
      const response = await getClients();
      if (response.data) {
        const clientsData = response.data as unknown as Client[];
        setClients(clientsData);
        
        if (clientsData.length > 0) {
          setSelectedClient(clientsData[0].id);
          setSelectedClientData(clientsData[0]);
          
          // Mettre à jour le nom de la feuille en fonction du client sélectionné
          const selectedClientName = clientsData[0].name;
          setSheetName(`Campagne - ${selectedClientName}`);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des clients:", error);
      toast.error("Impossible de charger la liste des clients.");
    } finally {
      setIsLoadingClients(false);
    }
  };

  const handleClientSelect = (clientId: string, client?: Client) => {
    setSelectedClient(clientId);
    if (client) {
      setSelectedClientData(client);
      setSheetName(`Campagne - ${client.name}`);
    } else {
      // Trouver le client dans la liste
      const foundClient = clients.find(c => c.id === clientId);
      if (foundClient) {
        setSelectedClientData(foundClient);
        setSheetName(`Campagne - ${foundClient.name}`);
      }
    }
  };

  const handleCreateSheet = async () => {
    if (!sheetName.trim()) {
      toast.error("Veuillez entrer un nom pour la feuille.");
      return;
    }

    setIsCreating(true);
    try {
      // Créer une feuille locale (plus besoin d'API Google)
      const newSheet = await sheetService.createSheet(sheetName, selectedClientData);
      if (newSheet) {
        toast.success(`Projet "${sheetName}" créé avec succès!`);
        setIsOpen(false);
        
        // Réinitialiser le formulaire
        const firstClient = clients.length > 0 ? clients[0].id : null;
        setSelectedClient(firstClient);
        if (firstClient) {
          const client = clients.find(client => client.id === firstClient);
          setSelectedClientData(client || null);
          const clientName = client?.name;
          setSheetName(`Campagne - ${clientName}`);
        } else {
          setSheetName("Campagne publicitaire");
        }
        
        onSheetCreated();
      }
    } catch (error) {
      console.error("Erreur lors de la création de la feuille:", error);
      toast.error("Impossible de créer le projet.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Créer un nouveau projet</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau projet</DialogTitle>
          <DialogDescription>
            Créez un projet local que vous pourrez connecter à vos feuilles CryptPad
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Un projet vous permet d'organiser vos campagnes. Vous pourrez ensuite connecter vos feuilles CryptPad à ce projet.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="client" className="text-right">
              Client
            </Label>
            <div className="col-span-3">
              <ClientSelector
                clients={clients}
                selectedClient={selectedClient}
                onClientSelect={handleClientSelect}
                isLoading={isLoadingClients}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nom
            </Label>
            <Input
              id="name"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isCreating}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleCreateSheet}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <span className="animate-spin mr-2">⊚</span>
                Création...
              </>
            ) : (
              "Créer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSheetDialog;
