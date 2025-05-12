
import { toast } from "sonner";

// Fonction utilitaire pour récupérer le token d'accès
export const getUserAccessToken = (): string | null => {
  const user = localStorage.getItem('google_user');
  if (!user) {
    toast.error("Veuillez vous connecter avec Google");
    return null;
  }

  const userData = JSON.parse(user);
  return userData.accessToken;
};
