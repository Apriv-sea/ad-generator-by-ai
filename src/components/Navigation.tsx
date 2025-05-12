
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ExtendedUser } from "@/types/supabase-extensions";

const Navigation = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navigationItems = [
    { path: "/dashboard", label: "Tableau de bord" },
    { path: "/clients", label: "Clients" },
    { path: "/campaigns", label: "Campagnes" },
    { path: "/settings", label: "Paramètres" },
  ];

  // Helper functions to safely access user properties
  const getUserName = (): string => {
    const extendedUser = user as ExtendedUser;
    return extendedUser?.name || extendedUser?.email?.split('@')[0] || 'Utilisateur';
  };
  
  const getUserInitial = (): string => {
    return getUserName().charAt(0).toUpperCase();
  };

  const getUserAvatar = (): string | undefined => {
    return (user as ExtendedUser)?.picture;
  };

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
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <span className="hidden sm:inline">{getUserName()}</span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getUserAvatar()} alt={getUserName()} />
                      <AvatarFallback>{getUserInitial()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={logout}>
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" asChild>
                <Link to="/auth">Connexion</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
