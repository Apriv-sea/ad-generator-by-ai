
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/services/utils/supabaseUtils";

interface ApiKeyFormProps {
  onSave: () => void;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ onSave }) => {
  const [service, setService] = useState<string>("openai");
  const [apiKey, setApiKey] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const validateApiKey = (service: string, key: string): boolean => {
    if (!key.trim()) return false;
    
    switch (service) {
      case 'openai':
        return key.startsWith('sk-') || key.startsWith('sk-proj-');
      case 'anthropic':
        return key.startsWith('sk-ant-');
      case 'google':
        return key.length > 20; // Google API keys are typically longer
      default:
        return false;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!service || !apiKey) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    if (!validateApiKey(service, apiKey)) {
      toast.error("Format de clé API invalide pour ce service");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        toast.error("Vous devez être connecté pour effectuer cette action");
        return;
      }
      
      // Check if a key already exists for this service
      const { data: existingKey, error: fetchError } = await supabase
        .from('api_keys')
        .select('id')
        .eq('user_id', userId)
        .eq('service', service)
        .maybeSingle();
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (existingKey) {
        // Update existing key
        const { error: updateError } = await supabase
          .from('api_keys')
          .update({ api_key: apiKey })
          .eq('id', existingKey.id)
          .eq('user_id', userId);
          
        if (updateError) throw updateError;
        
        toast.success(`Clé API pour ${service} mise à jour avec succès`);
      } else {
        // Insert new key
        const { error: insertError } = await supabase
          .from('api_keys')
          .insert({ 
            service, 
            api_key: apiKey, 
            user_id: userId 
          });
          
        if (insertError) throw insertError;
        
        toast.success(`Clé API pour ${service} ajoutée avec succès`);
      }
      
      // Reset form
      setApiKey("");
      onSave();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la clé API:", error);
      
      if (error.message?.includes('Invalid user_id')) {
        toast.error("Erreur de sécurité: ID utilisateur invalide");
      } else if (error.message?.includes('Authentication required')) {
        toast.error("Authentification requise");
      } else {
        toast.error("Erreur lors de l'enregistrement de la clé API");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="service">Service</Label>
        <Select value={service} onValueChange={setService}>
          <SelectTrigger id="service">
            <SelectValue placeholder="Sélectionner un service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI (GPT-4, GPT-3.5)</SelectItem>
            <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
            <SelectItem value="google">Google Gemini</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Sélectionnez le service d'IA pour lequel vous souhaitez configurer une clé API
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="api-key">Clé API</Label>
        <Input 
          id="api-key" 
          value={apiKey} 
          onChange={(e) => setApiKey(e.target.value)} 
          placeholder={service === 'openai' ? 'sk-...' : service === 'anthropic' ? 'sk-ant-...' : 'AIza...'} 
          className="font-mono"
          type="password"
        />
        <p className="text-xs text-muted-foreground">
          Votre clé API est stockée de manière sécurisée et chiffrée
        </p>
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Enregistrement..." : "Enregistrer la clé API"}
      </Button>
    </form>
  );
};

export default ApiKeyForm;
