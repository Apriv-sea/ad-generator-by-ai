
import { Client } from "./types/client";
import { addClient, updateClient, deleteClient } from "./clientMutation";
import { getClients, getClientById, getClientInfo } from "./clientQuery";

// Re-export getClients for backward compatibility
export { getClients };

// Export the unified client service
export const clientService = {
  // Query operations
  getClientById,
  getClientInfo,

  // Mutation operations
  addClient,
  updateClient,
  deleteClient
};
