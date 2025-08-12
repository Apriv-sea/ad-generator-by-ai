-- Phase 1: Critical Security Fixes

-- 1. Add encryption functions for API keys
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create secure encryption functions
CREATE OR REPLACE FUNCTION public.encrypt_api_key(api_key text, user_salt text DEFAULT gen_random_uuid()::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN encode(
    encrypt_iv(
      api_key::bytea,
      digest(user_salt || auth.uid()::text, 'sha256'),
      gen_random_bytes(16)
    ),
    'base64'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key text, user_salt text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN convert_from(
    decrypt_iv(
      decode(encrypted_key, 'base64'),
      digest(user_salt || auth.uid()::text, 'sha256')
    ),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- 2. Add encryption salt column to api_keys table
ALTER TABLE public.api_keys 
ADD COLUMN IF NOT EXISTS encryption_salt text,
ADD COLUMN IF NOT EXISTS is_encrypted boolean DEFAULT false;

-- 3. Update api_keys table with proper constraints
ALTER TABLE public.api_keys 
ADD CONSTRAINT api_keys_service_check CHECK (service IN ('openai', 'anthropic', 'google'));

-- 4. Harden existing database functions with proper search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_backups()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.data_backups 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_automatic_backup(_user_id uuid, _backup_type text, _data_reference text, _backup_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  backup_id UUID;
BEGIN
  INSERT INTO public.data_backups (user_id, backup_type, data_reference, backup_data)
  VALUES (_user_id, _backup_type, _data_reference, _backup_data)
  RETURNING id INTO backup_id;
  
  RETURN backup_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_template_usage(_template_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.campaign_templates 
  SET usage_count = usage_count + 1, updated_at = now()
  WHERE id = _template_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_api_key_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- 5. Add role escalation prevention trigger
CREATE OR REPLACE FUNCTION public.prevent_self_role_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Prevent users from modifying their own roles
  IF TG_OP = 'UPDATE' AND OLD.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Users cannot modify their own roles';
  END IF;
  
  -- Prevent users from deleting their own roles
  IF TG_OP = 'DELETE' AND OLD.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Users cannot delete their own roles';
  END IF;
  
  -- Log role changes for audit
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.role_audit_log (user_id, target_user_id, old_role, new_role, action)
    VALUES (auth.uid(), NEW.user_id, OLD.role, NEW.role, 'UPDATE');
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_audit_log (user_id, target_user_id, old_role, new_role, action)
    VALUES (auth.uid(), OLD.user_id, OLD.role, null, 'DELETE');
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_audit_log (user_id, target_user_id, old_role, new_role, action)
    VALUES (auth.uid(), NEW.user_id, null, NEW.role, 'INSERT');
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for role protection
DROP TRIGGER IF EXISTS prevent_self_role_modification ON public.user_roles;
CREATE TRIGGER prevent_self_role_modification
  BEFORE UPDATE OR DELETE OR INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_modification();

-- 6. Enhanced profile security - add access logging
CREATE TABLE IF NOT EXISTS public.profile_access_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  accessing_user_id uuid NOT NULL,
  accessed_profile_id uuid NOT NULL,
  access_type text NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profile_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view access logs
CREATE POLICY "Admins can view profile access logs"
  ON public.profile_access_log
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND public.has_role(auth.uid(), 'admin')
  );

-- 7. Add API key access logging
CREATE TABLE IF NOT EXISTS public.api_key_access_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  service text NOT NULL,
  access_type text NOT NULL, -- 'created', 'read', 'updated', 'deleted'
  ip_address inet,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.api_key_access_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own API key access logs
CREATE POLICY "Users can view their own API key access logs"
  ON public.api_key_access_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only the system can insert access logs
CREATE POLICY "System can insert API key access logs"
  ON public.api_key_access_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 8. Enhance campaign template security
-- Add organization concept for template sharing
ALTER TABLE public.campaign_templates 
ADD COLUMN IF NOT EXISTS organization_id uuid,
ADD COLUMN IF NOT EXISTS sharing_level text DEFAULT 'private' CHECK (sharing_level IN ('private', 'organization', 'public'));

-- Update template policies to be more restrictive
DROP POLICY IF EXISTS "Users can view their own templates and public templates" ON public.campaign_templates;

CREATE POLICY "Users can view their templates, org templates, and public templates"
  ON public.campaign_templates
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR (sharing_level = 'public' AND is_public = true)
    OR (sharing_level = 'organization' AND organization_id IS NOT NULL)
  );

-- 9. Add session security enhancements
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_token text NOT NULL UNIQUE,
  ip_address inet,
  user_agent text,
  last_activity timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own sessions
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert their own sessions"
  ON public.user_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update their own sessions"
  ON public.user_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE public.user_sessions 
  SET is_active = false
  WHERE expires_at < now() OR last_activity < (now() - interval '24 hours');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;