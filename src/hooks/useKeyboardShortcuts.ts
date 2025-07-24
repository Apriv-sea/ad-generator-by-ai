import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface KeyboardShortcuts {
  [key: string]: () => void;
}

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const shortcuts: KeyboardShortcuts = {
      // Navigation shortcuts
      'ctrl+1': () => navigate('/dashboard'),
      'ctrl+2': () => navigate('/campaigns'),
      'ctrl+3': () => navigate('/clients'),
      'ctrl+4': () => navigate('/settings'),
      
      // Actions shortcuts
      'ctrl+n': () => {
        const currentPath = window.location.pathname;
        if (currentPath === '/campaigns') {
          // Trigger new campaign
          const button = document.querySelector('[data-action="new-campaign"]') as HTMLButtonElement;
          button?.click();
        } else if (currentPath === '/clients') {
          // Trigger new client
          const button = document.querySelector('[data-action="new-client"]') as HTMLButtonElement;
          button?.click();
        }
      },
      
      // Quick actions
      'ctrl+shift+g': () => navigate('/campaigns'), // Quick generate
      'ctrl+/': () => {
        toast({
          title: "Raccourcis clavier",
          description: "Ctrl+1: Tableau de bord • Ctrl+2: Campagnes • Ctrl+3: Clients • Ctrl+N: Nouveau • Ctrl+Shift+G: Génération rapide",
          duration: 5000,
        });
      },
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = [
        event.ctrlKey && 'ctrl',
        event.shiftKey && 'shift',
        event.altKey && 'alt',
        event.key.toLowerCase()
      ].filter(Boolean).join('+');

      const shortcut = shortcuts[key];
      if (shortcut) {
        event.preventDefault();
        shortcut();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate, toast]);
};