-- Fix digest function issues and ensure proper pgcrypto setup

-- Ensure pgcrypto extension is properly installed
DROP EXTENSION IF EXISTS pgcrypto;
CREATE EXTENSION pgcrypto;

-- Drop and recreate functions with proper type casting
DROP FUNCTION IF EXISTS public.encrypt_api_key(text, text);
DROP FUNCTION IF EXISTS public.decrypt_api_key(text, text);
DROP FUNCTION IF EXISTS public.store_encrypted_api_key(text, text);
DROP FUNCTION IF EXISTS public.get_encrypted_api_key(text);

-- Create encrypt function with explicit casts
CREATE OR REPLACE FUNCTION public.encrypt_api_key(api_key text, user_salt text DEFAULT (gen_random_uuid())::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN encode(
    encrypt_iv(
      convert_to(api_key, 'UTF8'),
      digest(convert_to(user_salt || auth.uid()::text, 'UTF8'), 'sha256'),
      gen_random_bytes(16)
    ),
    'base64'
  );
END;
$function$;

-- Create decrypt function with explicit casts
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
      digest(convert_to(user_salt || auth.uid()::text, 'UTF8'), 'sha256')
    ),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$function$;

-- Simplified store function using direct database operations
CREATE OR REPLACE FUNCTION public.store_encrypted_api_key(
  service_name text,
  api_key_value text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_salt text;
  encrypted_key text;
  user_uuid uuid;
BEGIN
  -- Check authentication
  user_uuid := auth.uid();
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Generate salt
  user_salt := gen_random_uuid()::text;
  
  -- Encrypt the key using convert_to for proper encoding
  BEGIN
    encrypted_key := encode(
      encrypt_iv(
        convert_to(api_key_value, 'UTF8'),
        digest(convert_to(user_salt || user_uuid::text, 'UTF8'), 'sha256'),
        gen_random_bytes(16)
      ),
      'base64'
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Encryption failed: %', SQLERRM;
  END;
  
  -- Store in database with upsert
  INSERT INTO public.api_keys (user_id, service, api_key, is_encrypted, encryption_salt)
  VALUES (user_uuid, service_name, encrypted_key, true, user_salt)
  ON CONFLICT (user_id, service) 
  DO UPDATE SET 
    api_key = EXCLUDED.api_key,
    is_encrypted = true,
    encryption_salt = EXCLUDED.encryption_salt,
    created_at = now();
    
  RETURN json_build_object('success', true, 'message', 'API key stored successfully');
END;
$function$;

-- Simplified get function
CREATE OR REPLACE FUNCTION public.get_encrypted_api_key(service_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  key_record RECORD;
  decrypted_key text;
  user_uuid uuid;
BEGIN
  -- Check authentication
  user_uuid := auth.uid();
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get the key record
  SELECT api_key, encryption_salt, is_encrypted 
  INTO key_record
  FROM public.api_keys 
  WHERE user_id = user_uuid AND service = service_name;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- If not encrypted, return as is
  IF NOT key_record.is_encrypted THEN
    RETURN key_record.api_key;
  END IF;
  
  -- Decrypt the key
  BEGIN
    decrypted_key := convert_from(
      decrypt_iv(
        decode(key_record.api_key, 'base64'),
        digest(convert_to(key_record.encryption_salt || user_uuid::text, 'UTF8'), 'sha256')
      ),
      'UTF8'
    );
  EXCEPTION
    WHEN OTHERS THEN
      RETURN NULL;
  END;
  
  RETURN decrypted_key;
END;
$function$;