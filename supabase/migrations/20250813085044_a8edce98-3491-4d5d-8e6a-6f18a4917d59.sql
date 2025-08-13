-- Fix remaining security linter warnings

-- 1. Fix function search path for all remaining functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_backups()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.data_backups 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_automatic_backup(_user_id uuid, _backup_type text, _data_reference text, _backup_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  backup_id UUID;
BEGIN
  INSERT INTO public.data_backups (user_id, backup_type, data_reference, backup_data)
  VALUES (_user_id, _backup_type, _data_reference, _backup_data)
  RETURNING id INTO backup_id;
  
  RETURN backup_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_template_usage(_template_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.campaign_templates 
  SET usage_count = usage_count + 1, updated_at = now()
  WHERE id = _template_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_self_role_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

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

CREATE OR REPLACE FUNCTION public.is_authenticated_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL;
$function$;