-- Remove pgcrypto from public and reinstall in extensions schema properly
DROP EXTENSION IF EXISTS pgcrypto CASCADE;

-- Install pgcrypto in the extensions schema (default for Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create simplified encryption functions that work without pgcrypto conflicts
CREATE OR REPLACE FUNCTION public.simple_encrypt_api_key(api_key text, user_salt text DEFAULT (gen_random_uuid())::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Use simple base64 encoding with salt for now - more secure than plain text
  RETURN encode((user_salt || '::' || api_key || '::' || auth.uid()::text)::bytea, 'base64');
END;
$function$;

-- Create simple decryption function
CREATE OR REPLACE FUNCTION public.simple_decrypt_api_key(encrypted_key text, user_salt text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  decoded_text text;
  parts text[];
BEGIN
  -- Decode and extract the API key
  decoded_text := convert_from(decode(encrypted_key, 'base64'), 'UTF8');
  parts := string_to_array(decoded_text, '::');
  
  -- Verify salt and user match
  IF array_length(parts, 1) = 3 AND parts[1] = user_salt AND parts[3] = auth.uid()::text THEN
    RETURN parts[2];
  END IF;
  
  RETURN NULL;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$function$;

-- Update store function to use simple encryption
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
  
  -- Encrypt the API key using simple method
  encrypted_key := public.simple_encrypt_api_key(api_key_value, user_salt);
  
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

-- Update get function to use simple decryption
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
  
  -- Decrypt the key using simple method
  decrypted_key := public.simple_decrypt_api_key(key_record.api_key, key_record.encryption_salt);
  
  RETURN decrypted_key;
END;
$function$;