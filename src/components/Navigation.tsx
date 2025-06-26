
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, Settings, LogOut } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import Breadcrumb from "./Breadcrumb";
import { NavigationItems } from "./navigation/NavigationItems";
import { UserMenu } from "./navigation/UserMenu";

const Navigation = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { profile } = useUserProfile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navigationItems = [
    { path: "/dashboard", label: "Tableau de bord" },
    { path: "/clients", label: "Clients" },
    { path: "/campaigns", label: "Campagnes" },
    { path: "/settings", label: "Paramètres" },
  ];

  const getUserName = (): string => {
    return profile?.full_name || user?.email?.split('@')[0] || 'Utilisateur';
  };
  
  const getUserInitial = (): string => {
    return getUserName().charAt(0).toUpperCase();
  };

  const getUserAvatar = (): string | undefined => {
    return profile?.avatar_url || undefined;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <>
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/dashboard" className="text-xl font-bold hover:opacity-80 transition-opacity">
                Ad Content Generator
              </Link>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                <NavigationItems 
                  items={navigationItems} 
                  isActive={isActive}
                />
              </nav>
            </div>
            
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {/* Mobile Menu */}
                  <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild className="md:hidden">
                      <Button variant="ghost" size="icon">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72">
                      <div className="flex flex-col gap-4 mt-6">
                        <div className="flex items-center gap-3 pb-4 border-b">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={getUserAvatar()} alt={getUserName()} />
                            <AvatarFallback>{getUserInitial()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{getUserName()}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <nav className="flex flex-col gap-1">
                          <NavigationItems 
                            items={navigationItems} 
                            isActive={isActive}
                            onItemClick={() => setIsMobileMenuOpen(false)}
                          />
                        </nav>
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Desktop User Menu */}
                  <UserMenu 
                    user={user}
                    userName={getUserName()}
                    userAvatar={getUserAvatar()}
                    userInitial={getUserInitial()}
                    onLogout={handleLogout}
                  />
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="outline">
                    Connexion
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Breadcrumb - only show on protected pages */}
      {user && location.pathname !== '/dashboard' && (
        <div className="container mx-auto px-4 py-2 border-b bg-gray-50">
          <Breadcrumb />
        </div>
      )}
    </>
  );
};

export default Navigation;
