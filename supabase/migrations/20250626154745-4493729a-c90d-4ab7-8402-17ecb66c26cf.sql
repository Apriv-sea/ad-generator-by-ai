
-- Table pour l'historique des générations de contenu
CREATE TABLE public.content_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sheet_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  ad_group_name TEXT NOT NULL,
  generated_content JSONB NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_data JSONB,
  tokens_used INTEGER,
  validation_results JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les templates de campagnes
CREATE TABLE public.campaign_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les métriques et analytics
CREATE TABLE public.user_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  session_id TEXT,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les backups automatiques
CREATE TABLE public.data_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_type TEXT NOT NULL, -- 'sheet_data', 'campaign_data', 'user_settings'
  data_reference TEXT NOT NULL, -- sheet_id ou autre référence
  backup_data JSONB NOT NULL,
  compressed_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days')
);

-- Indexes pour les performances
CREATE INDEX idx_content_generations_user_id ON public.content_generations(user_id);
CREATE INDEX idx_content_generations_sheet_id ON public.content_generations(sheet_id);
CREATE INDEX idx_content_generations_created_at ON public.content_generations(created_at DESC);

CREATE INDEX idx_campaign_templates_user_id ON public.campaign_templates(user_id);
CREATE INDEX idx_campaign_templates_public ON public.campaign_templates(is_public) WHERE is_public = true;

CREATE INDEX idx_user_analytics_user_id ON public.user_analytics(user_id);
CREATE INDEX idx_user_analytics_event_type ON public.user_analytics(event_type);
CREATE INDEX idx_user_analytics_created_at ON public.user_analytics(created_at DESC);

CREATE INDEX idx_data_backups_user_id ON public.data_backups(user_id);
CREATE INDEX idx_data_backups_expires_at ON public.data_backups(expires_at);

-- Enable RLS on all tables
ALTER TABLE public.content_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_backups ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_generations
CREATE POLICY "Users can view their own content generations" 
  ON public.content_generations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content generations" 
  ON public.content_generations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for campaign_templates
CREATE POLICY "Users can view their own templates and public templates" 
  ON public.campaign_templates 
  FOR SELECT 
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own templates" 
  ON public.campaign_templates 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
  ON public.campaign_templates 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
  ON public.campaign_templates 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for user_analytics
CREATE POLICY "Users can view their own analytics" 
  ON public.user_analytics 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analytics" 
  ON public.user_analytics 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for data_backups
CREATE POLICY "Users can view their own backups" 
  ON public.data_backups 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backups" 
  ON public.data_backups 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at sur campaign_templates
CREATE TRIGGER update_campaign_templates_updated_at 
  BEFORE UPDATE ON public.campaign_templates 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour nettoyer les backups expirés
CREATE OR REPLACE FUNCTION public.cleanup_expired_backups()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.data_backups 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Fonction pour créer un backup automatique
CREATE OR REPLACE FUNCTION public.create_automatic_backup(
  _user_id UUID,
  _backup_type TEXT,
  _data_reference TEXT,
  _backup_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  backup_id UUID;
BEGIN
  INSERT INTO public.data_backups (user_id, backup_type, data_reference, backup_data)
  VALUES (_user_id, _backup_type, _data_reference, _backup_data)
  RETURNING id INTO backup_id;
  
  RETURN backup_id;
END;
$$;

-- Fonction pour incrémenter l'usage d'un template
CREATE OR REPLACE FUNCTION public.increment_template_usage(_template_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.campaign_templates 
  SET usage_count = usage_count + 1, updated_at = now()
  WHERE id = _template_id;
END;
$$;
