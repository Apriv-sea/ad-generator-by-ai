-- Fix the API key storage constraint issue
-- First, add the unique constraint that the ON CONFLICT clause expects
ALTER TABLE public.api_keys 
ADD CONSTRAINT api_keys_user_service_unique UNIQUE (user_id, service);

-- Update the store_encrypted_api_key function to handle the constraint properly
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
  
  -- Insert or update the encrypted key using the correct constraint
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