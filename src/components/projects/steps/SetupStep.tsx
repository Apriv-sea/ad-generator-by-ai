// Étape 1 : Configuration du projet et sélection client
// Interface simplifiée pour démarrer rapidement

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, CheckCircle, AlertCircle } from "lucide-react";

interface SetupStepProps {
  data: any;
  onDataUpdate: (updates: any) => void;
  onComplete: () => void;
}

const SetupStep: React.FC<SetupStepProps> = ({ data, onDataUpdate, onComplete }) => {
  const [projectName, setProjectName] = useState(data.projectName || '');
  const [selectedClientId, setSelectedClientId] = useState(data.selectedClient?.id || '');

  // Récupérer les clients
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const selectedClient = clients.find(c => c.id === selectedClientId);
  
  const canComplete = projectName.trim().length > 0 && selectedClientId;

  const handleComplete = () => {
    if (!canComplete) return;
    
    onDataUpdate({
      projectName: projectName.trim(),
      selectedClient: selectedClient
    });
    
    onComplete();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-600" />
          <span>Configuration du Projet</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Nom du projet */}
        <div className="space-y-2">
          <Label htmlFor="projectName">Nom du projet</Label>
          <Input
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Ex: Campagne Chaussures Sport 2024"
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Choisissez un nom descriptif pour identifier facilement ce projet
          </p>
        </div>

        {/* Sélection client */}
        <div className="space-y-3">
          <Label>Client</Label>
          
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          ) : clients.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucun client configuré. 
                <Button variant="link" className="p-0 ml-1 h-auto">
                  Créer un client d'abord
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {clients.map((client) => (
                <Card 
                  key={client.id}
                  className={`cursor-pointer transition-all ${
                    selectedClientId === client.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedClientId(client.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{client.name}</h4>
                        <Badge variant="outline" className="mt-1 text-xs">
                          Client
                        </Badge>
                      </div>
                      
                      {selectedClientId === client.id && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    
                    {client.business_context && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {client.business_context.substring(0, 100)}...
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Résumé sélection */}
        {selectedClient && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong>Client sélectionné:</strong> {selectedClient.name}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <Button 
            onClick={handleComplete}
            disabled={!canComplete}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Continuer vers l'import
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SetupStep;