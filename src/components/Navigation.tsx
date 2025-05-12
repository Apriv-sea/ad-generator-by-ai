
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navigationItems = [
    { path: "/dashboard", label: "Tableau de bord" },
    { path: "/clients", label: "Clients" },
    { path: "/campaigns", label: "Campagnes" },
    { path: "/settings", label: "Paramètres" },
  ];

  return (
    <header className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-xl font-bold">
              Ad Content Generator
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? "secondary" : "ghost"}
                    className={cn(
                      "text-sm",
                      isActive(item.path) ? "font-medium" : ""
                    )}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          
          <div>
            <Button variant="outline" asChild>
              <Link to="/auth">Déconnexion</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
