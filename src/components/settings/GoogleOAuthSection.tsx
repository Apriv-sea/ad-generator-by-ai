
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const GoogleOAuthSection: React.FC = () => {
  const { user } = useAuth();
  const [sheetsAccess, setSheetsAccess] = useState(false);
  const [driveAccess, setDriveAccess] = useState(false);

  // Load preferences from localStorage on component mount
  useEffect(() => {
    const storedSheetsAccess = localStorage.getItem("google_sheets_access");
    const storedDriveAccess = localStorage.getItem("google_drive_access");
    
    if (storedSheetsAccess) {
      setSheetsAccess(storedSheetsAccess === "true");
    }
    
    if (storedDriveAccess) {
      setDriveAccess(storedDriveAccess === "true");
    }
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Déconnecté avec succès");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const toggleSheetsAccess = () => {
    const newValue = !sheetsAccess;
    setSheetsAccess(newValue);
    localStorage.setItem("google_sheets_access", newValue.toString());
    
    if (newValue) {
      toast.success("Accès à Google Sheets activé");
    } else {
      toast.info("Accès à Google Sheets désactivé");
    }
  };
  
  const toggleDriveAccess = () => {
    const newValue = !driveAccess;
    setDriveAccess(newValue);
    localStorage.setItem("google_drive_access", newValue.toString());
    
    if (newValue) {
      toast.success("Accès à Google Drive activé");
    } else {
      toast.info("Accès à Google Drive désactivé");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Connexion Google</CardTitle>
        <CardDescription>
          Configurez l'accès à Google Drive et Google Sheets
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Compte Google connecté</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Se déconnecter
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sheets-access">Google Sheets</Label>
                <p className="text-sm text-muted-foreground">Accès pour lire/écrire dans vos feuilles de calcul</p>
              </div>
              <Switch 
                id="sheets-access" 
                checked={sheetsAccess}
                onCheckedChange={toggleSheetsAccess}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="drive-access">Google Drive</Label>
                <p className="text-sm text-muted-foreground">Accès pour gérer vos documents</p>
              </div>
              <Switch 
                id="drive-access" 
                checked={driveAccess}
                onCheckedChange={toggleDriveAccess}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );
};

export default GoogleOAuthSection;
