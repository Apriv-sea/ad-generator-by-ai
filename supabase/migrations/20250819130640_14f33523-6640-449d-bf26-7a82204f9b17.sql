-- Create OAuth states table for secure state validation
CREATE TABLE public.oauth_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  state TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes')
);

-- Enable RLS on oauth_states
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- OAuth states policies - users can only manage their own states
CREATE POLICY "Users can create their own OAuth states" 
ON public.oauth_states 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own OAuth states" 
ON public.oauth_states 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own OAuth states" 
ON public.oauth_states 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create Google tokens table for secure server-side token storage
CREATE TABLE public.google_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on google_tokens
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

-- Google tokens policies - users can only access their own tokens
CREATE POLICY "Users can insert their own Google tokens" 
ON public.google_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own Google tokens" 
ON public.google_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google tokens" 
ON public.google_tokens 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google tokens" 
ON public.google_tokens 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create audit log table for Google Sheets API calls
CREATE TABLE public.google_sheets_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  sheet_id TEXT,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.google_sheets_audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log policies
CREATE POLICY "Users can view their own audit logs" 
ON public.google_sheets_audit_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs" 
ON public.google_sheets_audit_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updating google_tokens updated_at
CREATE TRIGGER update_google_tokens_updated_at
  BEFORE UPDATE ON public.google_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to cleanup expired OAuth states
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.oauth_states 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;