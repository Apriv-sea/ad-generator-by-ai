-- Clean up duplicate Google tokens (keep the most recent one for each user)
DELETE FROM google_tokens 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM google_tokens 
  ORDER BY user_id, created_at DESC
);