-- Fix role-based access control policies and add audit logging

-- Fix role assignment policies - restrict to admins only
DROP POLICY IF EXISTS "Admins can create user roles" ON public.user_roles;
CREATE POLICY "Only admins can assign roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'admin'::user_role)
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