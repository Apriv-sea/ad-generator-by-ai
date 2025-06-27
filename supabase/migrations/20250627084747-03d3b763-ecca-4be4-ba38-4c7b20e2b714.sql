
-- Add missing RLS policies for content_generations table
CREATE POLICY "Users can update their own content generations" 
  ON public.content_generations 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own content generations" 
  ON public.content_generations 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Add missing RLS policies for data_backups table
CREATE POLICY "Users can update their own backups" 
  ON public.data_backups 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own backups" 
  ON public.data_backups 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Add complete RLS policies for user_analytics table
CREATE POLICY "Users can update their own analytics" 
  ON public.user_analytics 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own analytics" 
  ON public.user_analytics 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Add secure RLS policies for user_roles table (admin access only for modifications)
CREATE POLICY "Admins can view all user roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND 
    (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Admins can create user roles" 
  ON public.user_roles 
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update user roles" 
  ON public.user_roles 
  FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL AND 
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete user roles" 
  ON public.user_roles 
  FOR DELETE 
  USING (
    auth.uid() IS NOT NULL AND 
    public.has_role(auth.uid(), 'admin')
  );

-- Strengthen existing campaign_templates INSERT policy
DROP POLICY IF EXISTS "Users can create their own templates" ON public.campaign_templates;
CREATE POLICY "Users can create their own templates" 
  ON public.campaign_templates 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Add index for better performance on security queries
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);

-- Add function to validate user authentication status
CREATE OR REPLACE FUNCTION public.is_authenticated_user()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT auth.uid() IS NOT NULL;
$$;
