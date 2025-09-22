-- Fix the audit log policy to allow service role inserts
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.google_sheets_audit_log;

-- Create new policy that allows service role to insert 
CREATE POLICY "Service role can insert audit logs" 
ON public.google_sheets_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Also allow Edge Functions (service role) to insert into oauth_states
DROP POLICY IF EXISTS "Service role can manage OAuth states" ON public.oauth_states;

CREATE POLICY "Service role can manage OAuth states" 
ON public.oauth_states 
FOR ALL 
WITH CHECK (true);