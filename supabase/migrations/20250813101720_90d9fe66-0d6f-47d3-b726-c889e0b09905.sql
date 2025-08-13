-- Fix remaining security warnings by updating functions with proper search_path

-- Update store_encrypted_api_key function
CREATE OR REPLACE FUNCTION public.store_encrypted_api_key(service_name text, api_key_value text)
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

-- Update get_encrypted_api_key function
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

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$function$;

-- Update validate_api_key_user_id function
CREATE OR REPLACE FUNCTION public.validate_api_key_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Ensure user_id matches authenticated user
  IF NEW.user_id != auth.uid() OR NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid user_id: must match authenticated user';
  END IF;
  
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  RETURN NEW;
END;
$function$;