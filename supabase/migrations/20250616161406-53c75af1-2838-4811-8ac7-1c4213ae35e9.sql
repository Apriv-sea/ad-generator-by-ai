
-- Fix RLS policies for api_keys table
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can create their own api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update their own api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete their own api keys" ON public.api_keys;

-- Create secure RLS policies
CREATE POLICY "Users can view their own api keys" 
  ON public.api_keys 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own api keys" 
  ON public.api_keys 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own api keys" 
  ON public.api_keys 
  FOR UPDATE 
  USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own api keys" 
  ON public.api_keys 
  FOR DELETE 
  USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Add validation trigger to ensure user_id is always set correctly
CREATE OR REPLACE FUNCTION public.validate_api_key_user_id()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for INSERT and UPDATE
DROP TRIGGER IF EXISTS validate_api_key_user_id_trigger ON public.api_keys;
CREATE TRIGGER validate_api_key_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_api_key_user_id();

-- Make user_id column NOT NULL for data integrity
ALTER TABLE public.api_keys ALTER COLUMN user_id SET NOT NULL;
