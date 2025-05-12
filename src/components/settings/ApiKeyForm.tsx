
// I need to fix the ApiKeyForm.tsx file to properly type Supabase calls
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/services/utils/supabaseUtils";
import { ApiKey } from "@/types/supabase-extensions";

interface ApiKeyFormProps {
  service: string;
  onApiKeySaved: () => void;
  apiKey?: ApiKey;
  readOnly?: boolean;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ 
  service,
  onApiKeySaved,
  apiKey,
  readOnly = false
}) => {
  const [key, setKey] = useState(apiKey?.api_key || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const displayedKey = isVisible ? key : key.replace(/./g, "•");
  
  const isUpdateMode = !!apiKey;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!key.trim()) {
      toast.error("Veuillez entrer une clé API");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        toast.error("Vous devez être connecté pour enregistrer une clé API");
        return;
      }
      
      // Check if we already have a key for this service
      const { data: existingKeys } = await supabase
        .from('api_keys' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('service', service);
      
      if (!isUpdateMode && existingKeys && existingKeys.length > 0) {
        // Update existing key
        await supabase
          .from('api_keys' as any)
          .update({ api_key: key } as any)
          .eq('user_id', userId)
          .eq('service', service);
      } else if (isUpdateMode) {
        // Update specific key
        await supabase
          .from('api_keys' as any)
          .update({ api_key: key } as any)
          .eq('id', apiKey.id);
      } else {
        // Insert new key
        await supabase
          .from('api_keys' as any)
          .insert({
            service: service,
            api_key: key,
            user_id: userId
          } as any);
      }
      
      toast.success(`Clé API ${isUpdateMode ? 'mise à jour' : 'enregistrée'} avec succès`);
      onApiKeySaved();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la clé API:", error);
      toast.error("Une erreur est survenue lors de l'enregistrement de la clé API");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor={`${service}-key`}>
          {readOnly ? "Clé API" : `Entrez votre clé API ${isUpdateMode ? '(mise à jour)' : ''}`}
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Input
              id={`${service}-key`}
              value={displayedKey}
              onChange={(e) => setKey(e.target.value)}
              type="text"
              placeholder={`Entrez votre clé API ${service}`}
              disabled={isSubmitting || readOnly}
            />
            {key && (
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                className="absolute right-1 top-1/2 transform -translate-y-1/2"
                onClick={() => setIsVisible(!isVisible)}
              >
                {isVisible ? "Masquer" : "Afficher"}
              </Button>
            )}
          </div>
          {!readOnly && (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : isUpdateMode ? "Mettre à jour" : "Enregistrer"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default ApiKeyForm;
