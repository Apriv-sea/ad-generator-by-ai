
// Update src/services/clientService.ts to include exports from both query and mutation files
import { getClients, getClientById, getClientInfo, getClientShortInfo } from "./clientQuery";
import { addClient, updateClient, deleteClient } from "./clientMutation";
import { Client } from "./types/client";

// Export all client-related functions
export {
  getClients,
  getClientById,
  getClientInfo,
  getClientShortInfo,
  addClient,
  updateClient,
  deleteClient
};

// For backward compatibility, also export as a single object
export const clientService = {
  getClients,
  getClientById,
  getClientInfo,
  getClientShortInfo,
  addClient,
  updateClient,
  deleteClient
};
