
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  path: string;
}

const routeLabels: Record<string, string> = {
  '/': 'Accueil',
  '/dashboard': 'Tableau de bord',
  '/auth': 'Connexion',
  '/settings': 'Paramètres',
  '/clients': 'Clients',
  '/campaigns': 'Campagnes',
  '/profile': 'Profil',
  '/how-it-works': 'Comment ça marche',
  '/privacy-policy': 'Politique de confidentialité'
};

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Accueil', path: '/' }
  ];

  let currentPath = '';
  pathnames.forEach(pathname => {
    currentPath += `/${pathname}`;
    const label = routeLabels[currentPath] || pathname.charAt(0).toUpperCase() + pathname.slice(1);
    breadcrumbs.push({ label, path: currentPath });
  });

  // Don't show breadcrumb on home page or auth page
  if (location.pathname === '/' || location.pathname === '/auth') {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-600 mb-4">
      <Link to="/" className="flex items-center hover:text-blue-600 transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      
      {breadcrumbs.slice(1).map((breadcrumb, index) => (
        <React.Fragment key={breadcrumb.path}>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {index === breadcrumbs.length - 2 ? (
            <span className="text-gray-900 font-medium">{breadcrumb.label}</span>
          ) : (
            <Link 
              to={breadcrumb.path} 
              className="hover:text-blue-600 transition-colors"
            >
              {breadcrumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
