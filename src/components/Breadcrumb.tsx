
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BreadcrumbItem {
  label: string;
  path: string;
  isActive?: boolean;
}

const routeLabels: Record<string, string> = {
  '/': 'Accueil',
  '/dashboard': 'Tableau de bord',
  '/auth': 'Connexion',
  '/settings': 'Paramètres',
  '/clients': 'Clients',
  '/campaigns': 'Annonces',
  '/profile': 'Profil',
  '/how-it-works': 'Comment ça marche',
  '/privacy-policy': 'Politique de confidentialité'
};

const routeDescriptions: Record<string, string> = {
  '/dashboard': 'Vue d\'ensemble de vos projets et performances',
  '/clients': 'Gestion de votre portefeuille clients',
  '/campaigns': 'Génération et gestion de vos annonces publicitaires',
  '/settings': 'Configuration de votre compte et préférences'
};

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Accueil', path: '/' }
  ];

  let currentPath = '';
  pathnames.forEach((pathname, index) => {
    currentPath += `/${pathname}`;
    const label = routeLabels[currentPath] || pathname.charAt(0).toUpperCase() + pathname.slice(1);
    breadcrumbs.push({ 
      label, 
      path: currentPath,
      isActive: index === pathnames.length - 1
    });
  });

  // Don't show breadcrumb on home page or auth page
  if (location.pathname === '/' || location.pathname === '/auth') {
    return null;
  }

  const currentRoute = location.pathname;
  const description = routeDescriptions[currentRoute];

  return (
    <div className="space-y-2 mb-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-1 text-sm">
        <Link 
          to="/" 
          className="flex items-center text-muted-foreground hover:text-primary transition-colors p-1 rounded"
        >
          <Home className="w-4 h-4" />
        </Link>
        
        {breadcrumbs.slice(1).map((breadcrumb, index) => (
          <React.Fragment key={breadcrumb.path}>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            {breadcrumb.isActive ? (
              <div className="flex items-center gap-2">
                <span className="text-foreground font-medium">{breadcrumb.label}</span>
                <Badge variant="secondary" className="text-xs">Actuel</Badge>
              </div>
            ) : (
              <Link 
                to={breadcrumb.path} 
                className="text-muted-foreground hover:text-primary transition-colors p-1 rounded"
              >
                {breadcrumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Page Description */}
      {description && (
        <p className="text-sm text-muted-foreground pl-5">
          {description}
        </p>
      )}
    </div>
  );
};

export default Breadcrumb;
