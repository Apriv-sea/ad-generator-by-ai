-- Ensure pgcrypto extension is properly loaded in public schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- Create completely rewritten encryption functions that work with Supabase
CREATE OR REPLACE FUNCTION public.encrypt_api_key(api_key text, user_salt text DEFAULT (gen_random_uuid())::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  key_bytes bytea;
  iv_bytes bytea;
  encrypted_bytes bytea;
BEGIN
  -- Generate 32-byte key from salt and user ID
  key_bytes := public.digest((user_salt || auth.uid()::text)::bytea, 'sha256');
  
  -- Generate random IV
  iv_bytes := public.gen_random_bytes(16);
  
  -- Encrypt the API key
  encrypted_bytes := public.encrypt_iv(api_key::bytea, key_bytes, iv_bytes);
  
  -- Return base64 encoded result
  RETURN encode(encrypted_bytes, 'base64');
END;
$function$;

-- Create rewritten decryption function
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key text, user_salt text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  key_bytes bytea;
  encrypted_bytes bytea;
  decrypted_bytes bytea;
BEGIN
  -- Generate same key from salt and user ID
  key_bytes := public.digest((user_salt || auth.uid()::text)::bytea, 'sha256');
  
  -- Decode the encrypted data
  encrypted_bytes := decode(encrypted_key, 'base64');
  
  -- Decrypt the data
  decrypted_bytes := public.decrypt_iv(encrypted_bytes, key_bytes);
  
  -- Convert back to text
  RETURN convert_from(decrypted_bytes, 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$function$;

-- Update the store function to be more robust
CREATE OR REPLACE FUNCTION public.store_encrypted_api_key(service_name text, api_key_value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_salt text;
  encrypted_key text;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Generate unique salt
  user_salt := gen_random_uuid()::text;
  
  -- Encrypt the API key using the new function
  encrypted_key := public.encrypt_api_key(api_key_value, user_salt);
  
  -- Insert or update the encrypted key
  INSERT INTO public.api_keys (user_id, service, api_key, is_encrypted, encryption_salt)
  VALUES (current_user_id, service_name, encrypted_key, true, user_salt)
  ON CONFLICT (user_id, service) 
  DO UPDATE SET 
    api_key = EXCLUDED.api_key,
    is_encrypted = true,
    encryption_salt = EXCLUDED.encryption_salt,
    created_at = now();
    
  RETURN 'API key stored successfully';
END;
$function$;

-- Update the get function  
CREATE OR REPLACE FUNCTION public.get_encrypted_api_key(service_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  key_record RECORD;
  decrypted_key text;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get the encrypted key record
  SELECT api_key, encryption_salt, is_encrypted 
  INTO key_record
  FROM public.api_keys 
  WHERE user_id = current_user_id AND service = service_name;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- If not encrypted, return as is (legacy support)
  IF NOT key_record.is_encrypted THEN
    RETURN key_record.api_key;
  END IF;
  
  -- Decrypt the key using the new function
  decrypted_key := public.decrypt_api_key(key_record.api_key, key_record.encryption_salt);
  
  RETURN decrypted_key;
END;
$function$;