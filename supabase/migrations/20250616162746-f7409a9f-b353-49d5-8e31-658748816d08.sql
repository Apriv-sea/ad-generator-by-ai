
-- Remove duplicate/redundant RLS policies on api_keys table
-- Keep only the newer, more secure policies with proper authentication checks

-- Drop the old policies (these may not exist, but we'll try to drop them safely)
DROP POLICY IF EXISTS "api_keys_select_policy" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_insert_policy" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_update_policy" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_delete_policy" ON public.api_keys;

-- Ensure we have the correct, secure policies in place
-- (These should already exist from the migration, but let's make sure they're optimal)

-- Drop existing policies to recreate them with better names and ensure consistency
DROP POLICY IF EXISTS "Users can view their own api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can create their own api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update their own api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete their own api keys" ON public.api_keys;

-- Recreate secure RLS policies with enhanced security checks
CREATE POLICY "secure_api_keys_select" 
  ON public.api_keys 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "secure_api_keys_insert" 
  ON public.api_keys 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "secure_api_keys_update" 
  ON public.api_keys 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "secure_api_keys_delete" 
  ON public.api_keys 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Add an index for better performance on user_id queries
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);

-- Ensure the validation trigger is still in place and optimized
DROP TRIGGER IF EXISTS validate_api_key_user_id_trigger ON public.api_keys;
CREATE TRIGGER validate_api_key_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_api_key_user_id();
