-- Ajouter la colonne industry à la table clients
ALTER TABLE public.clients 
ADD COLUMN industry text;

-- Ajouter une contrainte pour s'assurer qu'un secteur valide est sélectionné
ALTER TABLE public.clients 
ADD CONSTRAINT valid_industry CHECK (industry IN (
  'e-commerce',
  'services-professionnels', 
  'technologie',
  'immobilier',
  'sante-bien-etre',
  'formation-education',
  'finance-assurance',
  'tourisme-loisirs',
  'automobile',
  'restaurant-alimentation',
  'mode-beaute',
  'construction-renovation',
  'sport-fitness',
  'juridique',
  'autre'
));

-- Mettre à jour les politiques RLS pour inclure la nouvelle colonne
-- (Les politiques existantes couvrent déjà cette colonne par défaut)