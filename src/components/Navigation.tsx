
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
    await logout();
  };

  const NavItems = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      {navigationItems.map((item) => (
        <Button
          key={item.path}
          variant={isActive(item.path) ? "secondary" : "ghost"}
          className={cn(
            "text-sm justify-start w-full",
            isActive(item.path) ? "font-medium bg-secondary" : "hover:bg-accent"
          )}
          asChild
        >
          <Link 
            to={item.path} 
            onClick={onItemClick}
            className="text-decoration-none"
          >
            {item.label}
          </Link>
        </Button>
      ))}
    </>
  );

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
                <NavItems />
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
                          <NavItems onItemClick={() => setIsMobileMenuOpen(false)} />
                        </nav>
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Desktop User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 hover:bg-accent">
                        <span className="hidden sm:inline">{getUserName()}</span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={getUserAvatar()} alt={getUserName()} />
                          <AvatarFallback>{getUserInitial()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="flex items-center gap-2 p-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={getUserAvatar()} alt={getUserName()} />
                          <AvatarFallback>{getUserInitial()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">{getUserName()}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                          <User className="h-4 w-4" />
                          Mon profil
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                          <Settings className="h-4 w-4" />
                          Paramètres
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleLogout} 
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        Déconnexion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button variant="outline" asChild>
                  <Link to="/auth">Connexion</Link>
                </Button>
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
