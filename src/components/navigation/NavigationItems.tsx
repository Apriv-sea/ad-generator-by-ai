
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavigationItem {
  path: string;
  label: string;
}

interface NavigationItemsProps {
  items: NavigationItem[];
  isActive: (path: string) => boolean;
  onItemClick?: () => void;
}

export const NavigationItems: React.FC<NavigationItemsProps> = ({ 
  items, 
  isActive, 
  onItemClick 
}) => {
  return (
    <>
      {items.map((item) => (
        <Link 
          key={item.path}
          to={item.path} 
          onClick={onItemClick}
          className="no-underline"
        >
          <Button
            variant={isActive(item.path) ? "secondary" : "ghost"}
            className={cn(
              "text-sm justify-start w-full",
              isActive(item.path) ? "font-medium bg-secondary" : "hover:bg-accent"
            )}
          >
            {item.label}
          </Button>
        </Link>
      ))}
    </>
  );
};
