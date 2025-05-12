
// src/components/settings/ApiKeyForm.tsx
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!service || !apiKey) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        toast.error("Vous devez être connecté pour effectuer cette action");
        return;
      }
      
      // Vérifier si une clé existe déjà pour ce service
      // Utilisation d'assertion de type pour interagir avec Supabase
      const { data: existingKey, error: fetchError } = await supabase
        .from('api_keys' as any)
        .select('id')
        .eq('user_id', userId)
        .eq('service', service)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = "no rows returned" (c'est OK si aucune clé n'existe)
        throw fetchError;
      }
      
      if (existingKey) {
        // Mettre à jour la clé existante
        // Utilisation d'assertion de type pour interagir avec Supabase
        const { error: updateError } = await supabase
          .from('api_keys' as any)
          .update({ api_key: apiKey })
          .eq('id', existingKey.id)
          .eq('user_id', userId);
          
        if (updateError) throw updateError;
        
        toast.success(`Clé API pour ${service} mise à jour avec succès`);
      } else {
        // Insérer une nouvelle clé
        // Utilisation d'assertion de type pour interagir avec Supabase
        const { error: insertError } = await supabase
          .from('api_keys' as any)
          .insert({ service, api_key: apiKey, user_id: userId });
          
        if (insertError) throw insertError;
        
        toast.success(`Clé API pour ${service} ajoutée avec succès`);
      }
      
      // Réinitialiser le formulaire
      setApiKey("");
      onSave();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la clé API:", error);
      toast.error("Erreur lors de l'enregistrement de la clé API");
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
            <SelectItem value="gemini">Google Gemini</SelectItem>
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
          placeholder="sk-..." 
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Votre clé API est stockée de manière sécurisée et n'est utilisée que pour les requêtes à l'API
        </p>
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Enregistrement..." : "Enregistrer la clé API"}
      </Button>
    </form>
  );
};

export default ApiKeyForm;
