import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApiKey } from "@/types/supabase-extensions";
import ApiKeyForm from "./ApiKeyForm";
import { Clipboard, Eye, EyeOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/services/utils/supabaseUtils";

// Define props interface
interface ApiKeysSectionProps {
  apiKeys: ApiKey[];
  isLoading: boolean;
  onApiKeySaved: () => void;
}

const ApiKeysSection: React.FC<ApiKeysSectionProps> = ({ apiKeys, isLoading, onApiKeySaved }) => {
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [deletingKeys, setDeletingKeys] = useState<Record<string, boolean>>({});
  
  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };
  
  const copyToClipboard = (text: string, service: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Clé API pour ${service} copiée dans le presse-papier`);
  };
  
  const deleteApiKey = async (keyId: string, service: string) => {
    try {
      setDeletingKeys(prev => ({ ...prev, [keyId]: true }));
      
      const userId = await getCurrentUserId();
      if (!userId) {
        toast.error("Vous devez être connecté pour effectuer cette action");
        return;
      }
      
      // Supprimer la clé API (toutes les clés utilisent maintenant le chiffrement)
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .match({ 
          id: keyId, 
          user_id: userId,
          is_encrypted: true 
        });
      
      if (error) {
        throw error;
      }
      
      toast.success(`Clé API pour ${service} supprimée avec succès`);
      onApiKeySaved(); // Recharger la liste des clés
    } catch (error) {
      console.error("Erreur lors de la suppression de la clé API:", error);
      toast.error("Erreur lors de la suppression de la clé API");
    } finally {
      setDeletingKeys(prev => ({ ...prev, [keyId]: false }));
    }
  };

  const renderApiKeys = () => {
    if (isLoading) {
      return (
        <div className="py-4 text-center text-muted-foreground">
          Chargement des clés API...
        </div>
      );
    }
    
    if (apiKeys.length === 0) {
      return (
        <div className="py-4 text-center text-muted-foreground">
          Aucune clé API enregistrée
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {apiKeys.map(key => (
          <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <p className="font-medium">{key.service}</p>
              <div className="flex items-center mt-1">
                <code className="text-xs bg-muted px-2 py-1 rounded flex-1 font-mono">
                  {visibleKeys[key.id] ? key.api_key : '•'.repeat(Math.min(30, key.api_key.length))}
                </code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleKeyVisibility(key.id)}
                  className="ml-2"
                >
                  {visibleKeys[key.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyToClipboard(key.api_key, key.service)}
                  className="ml-2"
                >
                  <Clipboard size={16} />
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => deleteApiKey(key.id, key.service)}
              disabled={!!deletingKeys[key.id]}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clés API</CardTitle>
        <CardDescription>
          Gérez vos clés API pour les services d'IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderApiKeys()}
        <div className="pt-4 border-t">
          <ApiKeyForm onSave={onApiKeySaved} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeysSection;
