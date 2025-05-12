
import { User } from "@supabase/supabase-js";
import { ExtendedUser } from "@/types/supabase-extensions";

/**
 * Process user metadata from Google OAuth to extract name and picture
 */
export const processUserMetadata = (user: User | null): ExtendedUser | null => {
  if (!user) return null;
  
  const extendedUser: ExtendedUser = user;

  // Check if user has metadata from OAuth provider (like Google)
  if (user.app_metadata?.provider === 'google' && user.user_metadata) {
    extendedUser.name = user.user_metadata.full_name || 
                        user.user_metadata.name ||
                        user.email?.split('@')[0] || 
                        'Utilisateur';
    
    extendedUser.picture = user.user_metadata.picture || 
                          user.user_metadata.avatar_url;
  }
  
  return extendedUser;
};

/**
 * Get user display name
 */
export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'Utilisateur';
  
  const extendedUser = user as ExtendedUser;
  return extendedUser.name || 
         user.email?.split('@')[0] || 
         'Utilisateur';
};
