
import React, { useState } from "react";
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
import { googleSheetsService } from "@/services/googleSheetsService";

interface CreateSheetDialogProps {
  onSheetCreated: () => void;
}

const CreateSheetDialog: React.FC<CreateSheetDialogProps> = ({ onSheetCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sheetName, setSheetName] = useState("Campagne publicitaire");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSheet = async () => {
    if (!sheetName.trim()) {
      toast.error("Veuillez entrer un nom pour la feuille.");
      return;
    }

    setIsCreating(true);
    try {
      const newSheet = await googleSheetsService.createSheet(sheetName);
      if (newSheet) {
        toast.success(`Feuille "${sheetName}" créée avec succès!`);
        setIsOpen(false);
        setSheetName("Campagne publicitaire");
        onSheetCreated();
      }
    } catch (error) {
      console.error("Erreur lors de la création de la feuille:", error);
      toast.error("Impossible de créer la feuille. Veuillez réessayer.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Créer une nouvelle feuille</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle feuille Google Sheets</DialogTitle>
          <DialogDescription>
            Entrez un nom pour votre nouvelle feuille de calcul
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
