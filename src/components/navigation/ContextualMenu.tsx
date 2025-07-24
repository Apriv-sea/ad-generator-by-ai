import React from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Download, 
  Upload, 
  Settings, 
  Wand2, 
  FileSpreadsheet,
  Users,
  HelpCircle,
  Keyboard
} from 'lucide-react';

interface ContextualMenuProps {
  onAction?: (action: string) => void;
}

export const ContextualMenu: React.FC<ContextualMenuProps> = ({ onAction }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const getContextualActions = () => {
    switch (currentPath) {
      case '/dashboard':
        return [
          { 
            icon: Plus, 
            label: 'Générer des annonces', 
            action: 'new-campaign',
            variant: 'default' as const,
            shortcut: 'Ctrl+N'
          },
          { 
            icon: Wand2, 
            label: 'Génération rapide', 
            action: 'quick-generate',
            variant: 'secondary' as const,
            shortcut: 'Ctrl+Shift+G'
          }
        ];
      
      case '/campaigns':
        return [
          { 
            icon: Plus, 
            label: 'Générer des annonces', 
            action: 'new-campaign',
            variant: 'default' as const,
            shortcut: 'Ctrl+N'
          },
          { 
            icon: Upload, 
            label: 'Importer', 
            action: 'import',
            variant: 'outline' as const
          },
          { 
            icon: Download, 
            label: 'Exporter', 
            action: 'export',
            variant: 'outline' as const
          }
        ];
      
      case '/clients':
        return [
          { 
            icon: Plus, 
            label: 'Nouveau client', 
            action: 'new-client',
            variant: 'default' as const,
            shortcut: 'Ctrl+N'
          },
          { 
            icon: Upload, 
            label: 'Importer clients', 
            action: 'import-clients',
            variant: 'outline' as const
          }
        ];
      
      default:
        return [
          { 
            icon: HelpCircle, 
            label: 'Aide', 
            action: 'help',
            variant: 'ghost' as const,
            shortcut: 'Ctrl+/'
          }
        ];
    }
  };

  const actions = getContextualActions();

  if (actions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 p-4 bg-card border-b border-border">
      <div className="flex items-center gap-2 flex-1">
        {actions.map((action) => {
          const IconComponent = action.icon;
          return (
            <Button
              key={action.action}
              variant={action.variant}
              size="sm"
              onClick={() => onAction?.(action.action)}
              data-action={action.action}
              className="gap-2"
            >
              <IconComponent className="h-4 w-4" />
              {action.label}
              {action.shortcut && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {action.shortcut}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onAction?.('shortcuts')}
        className="gap-2"
      >
        <Keyboard className="h-4 w-4" />
        Raccourcis
      </Button>
    </div>
  );
};