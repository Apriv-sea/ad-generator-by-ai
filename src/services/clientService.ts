
// Update src/services/clientService.ts pour corriger les imports
import { getClients, getClientById, getClientInfo } from "./clientQuery";
import { Client } from "./types/client";

// Export du module modifié
export {
  getClients,
  getClientById,
  getClientInfo,
  // addClient est maintenant importé depuis clientMutation
  // updateClient est maintenant importé depuis clientMutation
  // deleteClient est maintenant importé depuis clientMutation
};
