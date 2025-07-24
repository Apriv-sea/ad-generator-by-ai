-- Fix database function security vulnerabilities by adding proper search_path protection

-- Update has_role function to prevent schema injection
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
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

-- Update cleanup_expired_backups function
CREATE OR REPLACE FUNCTION public.cleanup_expired_backups()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Update create_automatic_backup function
CREATE OR REPLACE FUNCTION public.create_automatic_backup(_user_id uuid, _backup_type text, _data_reference text, _backup_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Update increment_template_usage function
CREATE OR REPLACE FUNCTION public.increment_template_usage(_template_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.campaign_templates 
  SET usage_count = usage_count + 1, updated_at = now()
  WHERE id = _template_id;
END;
$function$;

-- Update validate_api_key_user_id function
CREATE OR REPLACE FUNCTION public.validate_api_key_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Fix role-based access control - restrict role assignment to admins only
DROP POLICY IF EXISTS "Admins can create user roles" ON public.user_roles;
CREATE POLICY "Only admins can assign roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'admin'::user_role) AND
  NEW.user_id IS NOT NULL
);

-- Ensure only admins can modify roles
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
CREATE POLICY "Only admins can modify roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'admin'::user_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'admin'::user_role)
);

-- Create audit table for role changes
CREATE TABLE IF NOT EXISTS public.role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  old_role user_role,
  new_role user_role NOT NULL,
  action text NOT NULL, -- 'created', 'updated', 'deleted'
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view role audit logs"
ON public.role_audit_log
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::user_role));

-- Create trigger function for role audit logging
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_audit_log (user_id, target_user_id, new_role, action)
    VALUES (auth.uid(), NEW.user_id, NEW.role, 'created');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.role_audit_log (user_id, target_user_id, old_role, new_role, action)
    VALUES (auth.uid(), NEW.user_id, OLD.role, NEW.role, 'updated');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_audit_log (user_id, target_user_id, old_role, new_role, action)
    VALUES (auth.uid(), OLD.user_id, OLD.role, OLD.role, 'deleted');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Create audit trigger
DROP TRIGGER IF EXISTS role_changes_audit_trigger ON public.user_roles;
CREATE TRIGGER role_changes_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_role_changes();