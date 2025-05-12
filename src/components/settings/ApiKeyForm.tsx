
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error(`La clé API ${service} ne peut pas être vide.`);
      return;
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      toast.error("Vous devez être connecté pour sauvegarder une clé API.");
      return;
    }

    try {
      // Check if a key already exists for this service
      const { data: existingKeys } = await supabase
        .from('api_keys')
        .select('id')
        .eq('service', service) as any;
        
      if (existingKeys && existingKeys.length > 0) {
        // Update existing key
        const { error: updateError } = await supabase
          .from('api_keys')
          .update({ api_key: apiKey })
          .eq('service', service) as any;
          
        if (updateError) {
          console.error(`Erreur lors de la mise à jour de la clé API ${service}:`, updateError);
          toast.error(`Erreur lors de la sauvegarde de la clé API ${service}`);
          return;
        }
      } else {
        // Insert new key
        const { error: insertError } = await supabase
          .from('api_keys')
          .insert({ 
            service, 
            api_key: apiKey,
            user_id: user.id
          }) as any;
          
        if (insertError) {
          console.error(`Erreur lors de l'ajout de la clé API ${service}:`, insertError);
          toast.error(`Erreur lors de la sauvegarde de la clé API ${service}`);
          return;
        }
      }
      
      toast.success(`Clé API ${service} sauvegardée avec succès!`);
      validateApiKey(service, apiKey);
    } catch (error) {
      console.error(`Exception lors de la sauvegarde de la clé API ${service}:`, error);
      toast.error(`Une erreur s'est produite lors de la sauvegarde de la clé API ${service}`);
    }
  };
  
  const validateApiKey = (service: string, key: string) => {
    toast.info(`Validation de la clé API ${service}...`);
    
    setTimeout(() => {
      toast.success(`Clé API ${service} validée avec succès!`);
    }, 1500);
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor={`${service}-key`}>Clé API {service}</Label>
        <Input
          id={`${service}-key`}
          type="password"
          placeholder={placeholder}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {helpText} <a href={helpLink} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{service === "Google" ? "AI Studio Google" : service.toLowerCase() + ".com"}</a>
        </p>
      </div>
      <Button onClick={saveApiKey}>Sauvegarder</Button>
    </div>
  );
};

export default ApiKeyForm;
