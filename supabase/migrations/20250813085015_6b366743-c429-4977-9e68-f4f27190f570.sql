-- Critical Security Fixes: RLS Policies and Database Hardening

-- 1. Fix API Keys RLS policies to be more restrictive
DROP POLICY IF EXISTS "secure_api_keys_select" ON public.api_keys;
DROP POLICY IF EXISTS "secure_api_keys_insert" ON public.api_keys;
DROP POLICY IF EXISTS "secure_api_keys_update" ON public.api_keys;
DROP POLICY IF EXISTS "secure_api_keys_delete" ON public.api_keys;

CREATE POLICY "api_keys_owner_select" ON public.api_keys
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "api_keys_owner_insert" ON public.api_keys
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "api_keys_owner_update" ON public.api_keys
FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "api_keys_owner_delete" ON public.api_keys
FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 2. Strengthen user sessions RLS
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.user_sessions;

CREATE POLICY "sessions_owner_select" ON public.user_sessions
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "sessions_owner_insert" ON public.user_sessions
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "sessions_owner_update" ON public.user_sessions
FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 3. Add RLS policy for user analytics to prevent cross-user access
DROP POLICY IF EXISTS "Users can view their own analytics" ON public.user_analytics;
DROP POLICY IF EXISTS "Users can create their own analytics" ON public.user_analytics;
DROP POLICY IF EXISTS "Users can update their own analytics" ON public.user_analytics;
DROP POLICY IF EXISTS "Users can delete their own analytics" ON public.user_analytics;

CREATE POLICY "analytics_owner_select" ON public.user_analytics
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "analytics_owner_insert" ON public.user_analytics
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "analytics_owner_update" ON public.user_analytics
FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "analytics_owner_delete" ON public.user_analytics
FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 4. Secure database functions with proper search_path
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
      digest(user_salt || auth.uid()::text, 'sha256'),
      gen_random_bytes(16)
    ),
    'base64'
  );
END;
$function$;

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
      digest(user_salt || auth.uid()::text, 'sha256')
    ),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE public.user_sessions 
  SET is_active = false
  WHERE expires_at < now() OR last_activity < (now() - interval '24 hours');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

-- 5. Add session timeout and concurrent session limits
CREATE OR REPLACE FUNCTION public.enforce_session_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  active_sessions_count INTEGER;
  max_sessions INTEGER := 5; -- Maximum concurrent sessions per user
BEGIN
  -- Count active sessions for this user
  SELECT COUNT(*) INTO active_sessions_count
  FROM public.user_sessions
  WHERE user_id = NEW.user_id 
    AND is_active = true 
    AND expires_at > now();

  -- If at limit, deactivate oldest session
  IF active_sessions_count >= max_sessions THEN
    UPDATE public.user_sessions
    SET is_active = false
    WHERE user_id = NEW.user_id 
      AND is_active = true
      AND id = (
        SELECT id 
        FROM public.user_sessions 
        WHERE user_id = NEW.user_id AND is_active = true
        ORDER BY last_activity ASC 
        LIMIT 1
      );
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger for session limits
DROP TRIGGER IF EXISTS enforce_session_limits_trigger ON public.user_sessions;
CREATE TRIGGER enforce_session_limits_trigger
  BEFORE INSERT ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_session_limits();

-- 6. Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  ip_address inet,
  user_agent text,
  details jsonb,
  risk_level text NOT NULL DEFAULT 'low',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only view their own audit logs
CREATE POLICY "audit_log_owner_select" ON public.security_audit_log
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- System can insert audit logs
CREATE POLICY "audit_log_system_insert" ON public.security_audit_log
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can view all audit logs
CREATE POLICY "audit_log_admin_select" ON public.security_audit_log
FOR SELECT USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::user_role));

-- 7. Add function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  _action text,
  _resource_type text,
  _resource_id text DEFAULT NULL,
  _details jsonb DEFAULT NULL,
  _risk_level text DEFAULT 'low'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    risk_level
  ) VALUES (
    auth.uid(),
    _action,
    _resource_type,
    _resource_id,
    _details,
    _risk_level
  );
END;
$function$;