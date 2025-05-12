
import React, { useState } from "react";
import { Client } from "@/services/googleSheetsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

interface ClientInfoCardProps {
  clientInfo: Client | null;
}

const ClientInfoCard: React.FC<ClientInfoCardProps> = ({ clientInfo }) => {
  const [showClientInfo, setShowClientInfo] = useState(false);

  const toggleClientInfo = () => {
    setShowClientInfo(!showClientInfo);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Informations du client</CardTitle>
          <CardDescription>
            Contexte client utilisé pour la génération de contenu
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={toggleClientInfo}>
          <Info className="h-4 w-4 mr-2" />
          {showClientInfo ? "Masquer les détails" : "Voir les détails"}
        </Button>
      </CardHeader>
      {showClientInfo && (
        <CardContent>
          {clientInfo ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Client</h3>
                <p className="text-base">{clientInfo.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Contexte métier</h3>
                <p className="text-sm text-muted-foreground">{clientInfo.businessContext || "Non défini"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Spécificités</h3>
                <p className="text-sm text-muted-foreground">{clientInfo.specifics || "Non défini"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Charte éditoriale</h3>
                <p className="text-sm text-muted-foreground">{clientInfo.editorialGuidelines || "Non défini"}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune information client disponible</p>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ClientInfoCard;
