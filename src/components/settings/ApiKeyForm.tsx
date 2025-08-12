
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/services/utils/supabaseUtils";
import { SecurityMonitoringService } from "@/services/security/securityMonitoringService";
import { EncryptedApiKeyService } from "@/services/security/encryptedApiKeyService";

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
      await SecurityMonitoringService.logApiKeyEvent('validation_failed', service);
      toast.error("Format de clé API invalide pour ce service");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use encrypted storage service
      await EncryptedApiKeyService.storeEncrypted(service, apiKey);

      // Log successful API key creation/update
      await SecurityMonitoringService.logApiKeyEvent('created', service);
      
      toast.success(`Clé API pour ${service} sauvegardée de manière sécurisée avec chiffrement`);
      
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
