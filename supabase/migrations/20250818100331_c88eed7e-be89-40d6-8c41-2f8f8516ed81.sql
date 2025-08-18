-- Fix API key encryption and RLS security issues (corrected)

-- 1. Replace weak encryption functions with proper crypto
DROP FUNCTION IF EXISTS public.simple_encrypt_api_key(text, text);
DROP FUNCTION IF EXISTS public.simple_decrypt_api_key(text, text);

-- 2. Create proper encryption functions using pgcrypto
CREATE OR REPLACE FUNCTION public.encrypt_api_key_secure(api_key text, user_salt text DEFAULT (gen_random_uuid())::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  key_bytes bytea;
  iv_bytes bytea;
  encrypted_bytes bytea;
BEGIN
  -- Generate 32-byte key from salt and user ID using proper hashing
  key_bytes := public.digest((user_salt || auth.uid()::text)::bytea, 'sha256');
  
  -- Generate random IV for each encryption
  iv_bytes := public.gen_random_bytes(16);
  
  -- Encrypt the API key with AES
  encrypted_bytes := public.encrypt_iv(api_key::bytea, key_bytes, iv_bytes, 'aes');
  
  -- Return base64 encoded result with IV prepended
  RETURN encode(iv_bytes || encrypted_bytes, 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_api_key_secure(encrypted_key text, user_salt text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  key_bytes bytea;
  combined_data bytea;
  iv_bytes bytea;
  encrypted_bytes bytea;
  decrypted_bytes bytea;
BEGIN
  -- Decode the combined IV + encrypted data
  combined_data := decode(encrypted_key, 'base64');
  
  -- Extract IV (first 16 bytes) and encrypted data
  iv_bytes := substring(combined_data from 1 for 16);
  encrypted_bytes := substring(combined_data from 17);
  
  -- Generate same key from salt and user ID
  key_bytes := public.digest((user_salt || auth.uid()::text)::bytea, 'sha256');
  
  -- Decrypt the data
  decrypted_bytes := public.decrypt_iv(encrypted_bytes, key_bytes, iv_bytes, 'aes');
  
  -- Convert back to text
  RETURN convert_from(decrypted_bytes, 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- 3. Update the store and get functions to use secure encryption
CREATE OR REPLACE FUNCTION public.store_encrypted_api_key(service_name text, api_key_value text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
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
  
  -- Encrypt the API key using secure encryption
  encrypted_key := public.encrypt_api_key_secure(api_key_value, user_salt);
  
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
$$;

CREATE OR REPLACE FUNCTION public.get_encrypted_api_key(service_name text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
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
  
  -- If not encrypted, return as is (legacy support - but log this as suspicious)
  IF NOT key_record.is_encrypted THEN
    -- Log access to unencrypted key as security event
    INSERT INTO public.security_audit_log (
      user_id, action, resource_type, resource_id, details, risk_level
    ) VALUES (
      current_user_id, 
      'LEGACY_UNENCRYPTED_KEY_ACCESS', 
      'api_keys', 
      service_name,
      jsonb_build_object('service', service_name),
      'high'
    );
    RETURN key_record.api_key;
  END IF;
  
  -- Decrypt the key using secure decryption
  decrypted_key := public.decrypt_api_key_secure(key_record.api_key, key_record.encryption_salt);
  
  RETURN decrypted_key;
END;
$$;

-- 4. Fix the campaign templates RLS policy that exposes organization data
DROP POLICY IF EXISTS "Users can view their templates, org templates, and public templ" ON public.campaign_templates;
DROP POLICY IF EXISTS "Users can view own and authorized templates" ON public.campaign_templates;

CREATE POLICY "Users can view own and public templates only" 
ON public.campaign_templates 
FOR SELECT 
USING (
  -- Own templates
  (auth.uid() = user_id) 
  OR 
  -- Public templates only (no organization access)
  (sharing_level = 'public' AND is_public = true)
);

-- 5. Add missing constraints and triggers for security
ALTER TABLE public.api_keys 
ADD CONSTRAINT IF NOT EXISTS api_keys_user_id_not_null CHECK (user_id IS NOT NULL);

-- 6. Add trigger to validate API key operations
CREATE OR REPLACE FUNCTION public.validate_api_key_security()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure user_id matches authenticated user
  IF NEW.user_id != auth.uid() OR NEW.user_id IS NULL THEN
    -- Log security violation
    INSERT INTO public.security_audit_log (
      user_id, action, resource_type, details, risk_level
    ) VALUES (
      coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      'INVALID_API_KEY_USER_ID',
      'api_keys',
      jsonb_build_object('attempted_user_id', NEW.user_id, 'actual_user_id', auth.uid()),
      'critical'
    );
    RAISE EXCEPTION 'Security violation: Invalid user_id for API key operation';
  END IF;
  
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    INSERT INTO public.security_audit_log (
      user_id, action, resource_type, details, risk_level
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      'UNAUTHENTICATED_API_KEY_ACCESS',
      'api_keys',
      jsonb_build_object('service', NEW.service),
      'critical'
    );
    RAISE EXCEPTION 'Authentication required for API key operations';
  END IF;
  
  -- Log successful API key operations
  INSERT INTO public.security_audit_log (
    user_id, action, resource_type, resource_id, details, risk_level
  ) VALUES (
    auth.uid(),
    TG_OP || '_API_KEY',
    'api_keys',
    NEW.service,
    jsonb_build_object('service', NEW.service, 'encrypted', NEW.is_encrypted),
    'low'
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_api_key_security_trigger ON public.api_keys;
CREATE TRIGGER validate_api_key_security_trigger
  BEFORE INSERT OR UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.validate_api_key_security();