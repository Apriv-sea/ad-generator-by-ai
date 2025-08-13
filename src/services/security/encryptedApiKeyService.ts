import { supabase } from '@/integrations/supabase/client';

export interface ApiKeyData {
  id: string;
  user_id: string;
  service: string;
  api_key: string;
  is_encrypted: boolean;
  encryption_salt?: string;
  created_at: string;
}

export class EncryptedApiKeyService {
  /**
   * Migrate existing plain-text API key to encrypted format
   */
  static async migrateToEncrypted(service: string): Promise<void> {
    try {
      const { data: existingKey } = await supabase
        .from('api_keys')
        .select('*')
        .eq('service', service)
        .eq('is_encrypted', false)
        .single();

      if (!existingKey) return;

      // Generate salt for encryption
      const salt = crypto.randomUUID();
      
      // Encrypt the API key using database function
      const { data: encryptedKey, error: encryptError } = await supabase
        .rpc('encrypt_api_key', { 
          api_key: existingKey.api_key,
          user_salt: salt
        });

      if (encryptError) throw encryptError;

      // Update the record with encrypted data
      const { error: updateError } = await supabase
        .from('api_keys')
        .update({
          api_key: encryptedKey,
          encryption_salt: salt,
          is_encrypted: true
        })
        .eq('id', existingKey.id);

      if (updateError) throw updateError;

      // Log the migration
      await supabase.from('api_key_access_log').insert({
        user_id: existingKey.user_id,
        service,
        access_type: 'migrated_to_encrypted',
        success: true
      });

    } catch (error) {
      console.error('Failed to migrate API key to encrypted format:', error);
      throw error;
    }
  }

  /**
   * Store encrypted API key using database RPC function
   */
  static async storeEncrypted(service: string, apiKey: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      console.log(`🔐 Storing encrypted API key for service: ${service}`);

      // Use the new RPC function
      const { data, error } = await supabase.rpc('store_encrypted_api_key', {
        service_name: service,
        api_key_value: apiKey
      });

      if (error) {
        console.error('RPC error storing encrypted API key:', error);
        throw new Error(`Failed to store encrypted API key: ${error.message}`);
      }

      console.log('✅ API key stored successfully:', data);

      // Log successful access
      await supabase.from('api_key_access_log').insert({
        user_id: user.user.id,
        service,
        access_type: 'create',
        success: true
      });

    } catch (error) {
      console.error('Failed to store encrypted API key:', error);
      
      // Log failed access
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        await supabase.from('api_key_access_log').insert({
          user_id: user.user.id,
          service,
          access_type: 'create',
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      throw error;
    }
  }

  /**
   * Retrieve and decrypt API key using database RPC function
   */
  static async getDecrypted(service: string): Promise<string | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      console.log(`🔐 Retrieving decrypted API key for service: ${service}`);

      // Use the new RPC function
      const { data: decryptedKey, error } = await supabase.rpc('get_encrypted_api_key', {
        service_name: service
      });

      if (error) {
        console.error('RPC error retrieving encrypted API key:', error);
        throw new Error(`Failed to retrieve encrypted API key: ${error.message}`);
      }

      console.log(`✅ API key retrieved for ${service}:`, !!decryptedKey);

      // Log successful access
      await supabase.from('api_key_access_log').insert({
        user_id: user.user.id,
        service,
        access_type: 'read',
        success: true
      });

      return decryptedKey;

    } catch (error) {
      console.error('Failed to get decrypted API key:', error);
      
      // Log failed access
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        await supabase.from('api_key_access_log').insert({
          user_id: user.user.id,
          service,
          access_type: 'read',
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      return null;
    }
  }

  /**
   * Decrypt API key using database function
   */
  private static async decryptKey(keyData: ApiKeyData): Promise<string | null> {
    if (!keyData.encryption_salt) {
      throw new Error('Missing encryption salt for encrypted key');
    }

    const { data: decryptedKey, error } = await supabase
      .rpc('decrypt_api_key', {
        encrypted_key: keyData.api_key,
        user_salt: keyData.encryption_salt
      });

    if (error) throw error;

    // Log successful access
    await supabase.from('api_key_access_log').insert({
      user_id: keyData.user_id,
      service: keyData.service,
      access_type: 'read',
      success: true
    });

    return decryptedKey;
  }

  /**
   * Delete API key securely
   */
  static async deleteSecurely(service: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('service', service)
        .eq('user_id', user.user.id);

      if (error) throw error;

      // Log the deletion
      await supabase.from('api_key_access_log').insert({
        user_id: user.user.id,
        service,
        access_type: 'deleted',
        success: true
      });

    } catch (error) {
      console.error('Failed to delete API key:', error);
      throw error;
    }
  }
}