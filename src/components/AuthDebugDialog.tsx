
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
import { ScrollArea } from "@/components/ui/scroll-area";

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
        
        {sessionData && (
          <ScrollArea className="max-h-[400px] rounded border p-4 bg-slate-50">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Informations URL</h3>
                <pre className="whitespace-pre-wrap text-xs bg-slate-100 p-2 rounded">
                  {JSON.stringify(sessionData.url, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">User Agent</h3>
                <p className="text-sm">{sessionData.userAgent}</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">Données de localStorage</h3>
                <pre className="whitespace-pre-wrap text-xs bg-slate-100 p-2 rounded">
                  {JSON.stringify(localStorageData, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">Troubleshooting Steps</h3>
                <ol className="list-decimal pl-5 text-sm space-y-1">
                  <li>Vérifiez que l'URL de redirection est correctement configurée dans Google Cloud Console: <code>{window.location.origin}/auth/callback</code></li>
                  <li>Assurez-vous que <code>{window.location.origin}</code> est ajouté comme "Authorized JavaScript origins"</li>
                  <li>Vérifiez que votre email est ajouté comme utilisateur de test dans l'écran de consentement OAuth</li>
                  <li>Essayez de supprimer les cookies du navigateur et les données de localStorage</li>
                  <li>Essayez un autre navigateur</li>
                </ol>
              </div>
            </div>
          </ScrollArea>
        )}
        
        <DialogFooter>
          <Button variant="outline">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDebugDialog;
