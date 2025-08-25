-- Fix the duplicate key constraint issue in google_tokens table
-- First, let's check if the table exists and clean any duplicates

-- Remove any duplicate tokens (keep the most recent one)
DELETE FROM google_tokens 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM google_tokens 
  ORDER BY user_id, created_at DESC
);

-- If the table doesn't exist, create it with proper constraints
CREATE TABLE IF NOT EXISTS google_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for Google tokens
CREATE POLICY "Users can access their own Google tokens" 
ON google_tokens 
FOR ALL 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_google_tokens_updated_at
  BEFORE UPDATE ON google_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();