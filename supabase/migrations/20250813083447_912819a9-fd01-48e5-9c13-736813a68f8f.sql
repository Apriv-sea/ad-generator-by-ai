-- Add editorial constraints fields to clients table
ALTER TABLE public.clients 
ADD COLUMN forbidden_terms text[] DEFAULT '{}',
ADD COLUMN forbidden_phrases text[] DEFAULT '{}', 
ADD COLUMN forbidden_tones text[] DEFAULT '{}',
ADD COLUMN mandatory_terms text[] DEFAULT '{}',
ADD COLUMN constraint_priority text DEFAULT 'high' CHECK (constraint_priority IN ('low', 'medium', 'high', 'critical'));

-- Add comments for documentation
COMMENT ON COLUMN public.clients.forbidden_terms IS 'List of individual words/terms that must never appear in generated content';
COMMENT ON COLUMN public.clients.forbidden_phrases IS 'List of phrases/expressions that must never appear in generated content';
COMMENT ON COLUMN public.clients.forbidden_tones IS 'List of tones/styles that must be avoided (e.g., promotional, familiar, technical)';
COMMENT ON COLUMN public.clients.mandatory_terms IS 'List of terms that should preferably be included when relevant';
COMMENT ON COLUMN public.clients.constraint_priority IS 'Priority level for enforcing constraints: low, medium, high, critical';