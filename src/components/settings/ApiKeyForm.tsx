
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/services/utils/supabaseUtils";

interface ApiKeyFormProps {
  service: string;
  initialValue: string;
  placeholder: string;
  helpText: string;
  helpLink: string;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({
  service,
  initialValue,
  placeholder,
  helpText,
  helpLink
}) => {
  const [apiKey, setApiKey] = useState(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    setIsUpdating(true);
    
    try {
      const userId = await getCurrentUserId();
      
      if (!userId) {
        toast.error("Vous devez être connecté pour sauvegarder une clé API");
        setIsUpdating(false);
        return;
      }
      
      // Check if key already exists for this service
      const { data: existingKey, error: fetchError } = await supabase
        .from('api_keys')
        .select('*')
        .eq('service', service)
        .eq('user_id', userId);
      
      if (fetchError) {
        console.error("Erreur lors de la vérification de la clé API:", fetchError);
        toast.error("Erreur lors de la vérification de la clé API");
        setIsUpdating(false);
        return;
      }
      
      let result;
      
      if (existingKey && existingKey.length > 0) {
        // Update existing key
        result = await supabase
          .from('api_keys')
          .update({ api_key: apiKey })
          .eq('service', service)
          .eq('user_id', userId);
      } else {
        // Insert new key
        result = await supabase
          .from('api_keys')
          .insert({
            service: service,
            api_key: apiKey,
            user_id: userId
          });
      }
      
      if (result.error) {
        console.error("Erreur lors de l'enregistrement de la clé API:", result.error);
        toast.error("Impossible d'enregistrer la clé API");
      } else {
        toast.success("Clé API sauvegardée avec succès");
      }
    } catch (error) {
      console.error("Exception lors de l'enregistrement de la clé API:", error);
      toast.error("Une erreur s'est produite lors de l'enregistrement de la clé API");
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <Input
            type="password"
            placeholder={placeholder}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={handleSave}
            disabled={isUpdating}
            className="sm:w-auto"
          >
            {isUpdating ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {helpText} <a href={helpLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{helpLink}</a>
        </p>
      </div>
    </div>
  );
};

export default ApiKeyForm;
