-- Fix encrypted API key functions

-- Enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fix the encrypt_api_key function with proper parameter types
CREATE OR REPLACE FUNCTION public.encrypt_api_key(api_key text, user_salt text DEFAULT (gen_random_uuid())::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN encode(
    encrypt_iv(
      api_key::bytea,
      digest(user_salt || auth.uid()::text, 'sha256'::text),
      gen_random_bytes(16)
    ),
    'base64'
  );
END;
$function$;

-- Fix the decrypt_api_key function with proper parameter types
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key text, user_salt text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN convert_from(
    decrypt_iv(
      decode(encrypted_key, 'base64'),
      digest(user_salt || auth.uid()::text, 'sha256'::text)
    ),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$function$;

-- Create RPC function for storing encrypted API keys
CREATE OR REPLACE FUNCTION public.store_encrypted_api_key(
  service_name text,
  api_key_value text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_salt text;
  encrypted_key text;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Generate salt
  user_salt := gen_random_uuid()::text;
  
  -- Encrypt the API key
  encrypted_key := encrypt_api_key(api_key_value, user_salt);
  
  -- Insert or update the encrypted key
  INSERT INTO public.api_keys (user_id, service, api_key, is_encrypted, encryption_salt)
  VALUES (auth.uid(), service_name, encrypted_key, true, user_salt)
  ON CONFLICT (user_id, service) 
  DO UPDATE SET 
    api_key = EXCLUDED.api_key,
    is_encrypted = true,
    encryption_salt = EXCLUDED.encryption_salt,
    created_at = now();
    
  RETURN 'success';
END;
$function$;

-- Create RPC function for retrieving encrypted API keys
CREATE OR REPLACE FUNCTION public.get_encrypted_api_key(service_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  key_record RECORD;
  decrypted_key text;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get the encrypted key record
  SELECT api_key, encryption_salt, is_encrypted 
  INTO key_record
  FROM public.api_keys 
  WHERE user_id = auth.uid() AND service = service_name;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- If not encrypted, return as is (legacy)
  IF NOT key_record.is_encrypted THEN
    RETURN key_record.api_key;
  END IF;
  
  -- Decrypt the key
  decrypted_key := decrypt_api_key(key_record.api_key, key_record.encryption_salt);
  
  RETURN decrypted_key;
END;
$function$;