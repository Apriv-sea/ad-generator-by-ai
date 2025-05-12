
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import GoogleOAuthSection from "@/components/settings/GoogleOAuthSection";
import ApiKeysSection from "@/components/settings/ApiKeysSection";

const Settings = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth page if user is not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // API Keys state
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  
  // Google OAuth state
  const [sheetsAccess, setSheetsAccess] = useState(false);
  const [driveAccess, setDriveAccess] = useState(false);
  
  // Load saved API keys and connection status on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadApiKeys();
    }
    
    const googleSheetsAccess = localStorage.getItem("google_sheets_access") === "true";
    const googleDriveAccess = localStorage.getItem("google_drive_access") === "true";
    
    setSheetsAccess(googleSheetsAccess);
    setDriveAccess(googleDriveAccess);
  }, [isAuthenticated]);
  
  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys' as any)
        .select('service, api_key');
        
      if (error) {
        console.error("Erreur lors du chargement des clés API:", error);
        return;
      }
      
      if (data) {
        data.forEach((item: any) => {
          switch (item.service) {
            case 'openai':
              setOpenaiKey(item.api_key);
              break;
            case 'anthropic':
              setAnthropicKey(item.api_key);
              break;
            case 'google':
              setGoogleKey(item.api_key);
              break;
          }
        });
      }
    } catch (error) {
      console.error("Exception lors du chargement des clés API:", error);
    }
  };
  
  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };
  
  if (!isAuthenticated) {
    return null; // Don't show anything while redirecting
  }
  
  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Paramètres</h1>
        
        <div className="space-y-8">
          {/* Google OAuth Section */}
          <GoogleOAuthSection 
            user={user}
            sheetsAccess={sheetsAccess}
            driveAccess={driveAccess}
            setSheetsAccess={setSheetsAccess}
            setDriveAccess={setDriveAccess}
            handleLogout={handleLogout}
          />
          
          {/* API Keys Section */}
          <ApiKeysSection 
            openaiKey={openaiKey}
            anthropicKey={anthropicKey}
            googleKey={googleKey}
          />
        </div>
      </div>
    </>
  );
};

export default Settings;
