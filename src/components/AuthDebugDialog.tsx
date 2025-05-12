
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import DebugInfoContent from "./debug/DebugInfoContent";

interface AuthDebugDialogProps {
  trigger: React.ReactNode;
}

const AuthDebugDialog: React.FC<AuthDebugDialogProps> = ({ trigger }) => {
  const [sessionData, setSessionData] = React.useState<any>(null);
  const [localStorageData, setLocalStorageData] = React.useState<Record<string, string>>({});
  
  const collectDebugInfo = () => {
    // Check URL
    const urlInfo = {
      href: window.location.href,
      hash: window.location.hash,
      pathname: window.location.pathname,
      search: window.location.search,
      origin: window.location.origin,
    };
    
    // Check localStorage
    const lsData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          lsData[key] = value || '';
        } catch (e) {
          lsData[key] = "Error reading value";
        }
      }
    }
    setLocalStorageData(lsData);
    
    setSessionData({
      url: urlInfo,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Informations de débogage d'authentification</DialogTitle>
          <DialogDescription>
            Ces informations peuvent aider à résoudre les problèmes d'authentification.
          </DialogDescription>
        </DialogHeader>
        
        <Button onClick={collectDebugInfo} className="mb-4">
          Collecter les informations de débogage
        </Button>
        
        <DebugInfoContent 
          sessionData={sessionData}
          localStorageData={localStorageData}
        />
        
        <DialogFooter>
          <Button variant="outline">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDebugDialog;
