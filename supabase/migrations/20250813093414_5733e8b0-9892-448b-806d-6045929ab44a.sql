-- Complete RLS Policy Coverage and Security Hardening

-- Add missing DELETE policy for profiles table
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id);

-- Add missing policies for profile_access_log
CREATE POLICY "System can insert profile access logs" 
ON public.profile_access_log 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own profile access logs" 
ON public.profile_access_log 
FOR SELECT 
USING (auth.uid() = accessing_user_id OR auth.uid() = accessed_profile_id);

-- Add missing policies for role_audit_log  
CREATE POLICY "System can insert role audit logs" 
ON public.role_audit_log 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Add missing DELETE policy for user_sessions
CREATE POLICY "Users can delete their own sessions" 
ON public.user_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enhance role security with additional validation trigger
CREATE OR REPLACE FUNCTION public.validate_role_operations()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent role escalation attempts
  IF TG_OP = 'INSERT' AND NEW.role = 'admin' THEN
    IF NOT has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only admins can assign admin roles';
    END IF;
  END IF;
  
  -- Log security event for role changes
  INSERT INTO public.security_audit_log (
    user_id, action, resource_type, resource_id, details, risk_level
  ) VALUES (
    auth.uid(), 
    TG_OP || '_ROLE', 
    'user_roles', 
    NEW.user_id::text,
    jsonb_build_object(
      'target_user', NEW.user_id,
      'role', NEW.role,
      'operation', TG_OP
    ),
    CASE WHEN NEW.role = 'admin' THEN 'high' ELSE 'medium' END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role validation
DROP TRIGGER IF EXISTS validate_role_operations_trigger ON public.user_roles;
CREATE TRIGGER validate_role_operations_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_role_operations();

-- Add session cleanup automation
CREATE OR REPLACE FUNCTION public.automated_session_cleanup()
RETURNS void AS $$
BEGIN
  -- Cleanup expired sessions
  UPDATE public.user_sessions 
  SET is_active = false 
  WHERE expires_at < now() OR last_activity < (now() - interval '7 days');
  
  -- Log cleanup activity
  INSERT INTO public.security_audit_log (
    user_id, action, resource_type, details, risk_level
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'AUTOMATED_CLEANUP',
    'user_sessions',
    jsonb_build_object('cleanup_time', now()),
    'low'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to detect suspicious login patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_login_patterns(target_user_id uuid)
RETURNS boolean AS $$
DECLARE
  recent_failed_logins integer;
  recent_ips_count integer;
BEGIN
  -- Count failed logins in last hour
  SELECT COUNT(*) INTO recent_failed_logins
  FROM public.security_audit_log
  WHERE user_id = target_user_id
    AND action = 'FAILED_LOGIN'
    AND created_at > (now() - interval '1 hour');
  
  -- Count distinct IPs in last 24 hours
  SELECT COUNT(DISTINCT ip_address) INTO recent_ips_count
  FROM public.user_sessions
  WHERE user_id = target_user_id
    AND created_at > (now() - interval '24 hours');
  
  -- Return true if suspicious patterns detected
  RETURN (recent_failed_logins > 5 OR recent_ips_count > 10);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced API key access logging with rate limiting
CREATE OR REPLACE FUNCTION public.log_api_key_access_with_validation(
  service_name text,
  access_type_param text,
  success_param boolean DEFAULT true,
  error_msg text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  recent_access_count integer;
  user_uuid uuid;
BEGIN
  user_uuid := auth.uid();
  
  -- Check recent access frequency (rate limiting)
  SELECT COUNT(*) INTO recent_access_count
  FROM public.api_key_access_log
  WHERE user_id = user_uuid
    AND service = service_name
    AND created_at > (now() - interval '1 minute');
    
  -- If too many recent accesses, log as suspicious
  IF recent_access_count > 10 THEN
    INSERT INTO public.security_audit_log (
      user_id, action, resource_type, details, risk_level
    ) VALUES (
      user_uuid,
      'EXCESSIVE_API_ACCESS',
      'api_keys',
      jsonb_build_object(
        'service', service_name,
        'access_count', recent_access_count,
        'time_window', '1 minute'
      ),
      'high'
    );
  END IF;
  
  -- Log the access
  INSERT INTO public.api_key_access_log (
    user_id, service, access_type, success, error_message
  ) VALUES (
    user_uuid, service_name, access_type_param, success_param, error_msg
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;