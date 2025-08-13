-- Fix digest function type casting issues
CREATE OR REPLACE FUNCTION public.encrypt_api_key(api_key text, user_salt text DEFAULT (gen_random_uuid())::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN encode(
    encrypt_iv(
      api_key::bytea,
      digest((user_salt || auth.uid()::text)::bytea, 'sha256'::text),
      gen_random_bytes(16)
    ),
    'base64'
  );
END;
$function$;

-- Fix decrypt function with proper type casting
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key text, user_salt text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN convert_from(
    decrypt_iv(
      decode(encrypted_key, 'base64'),
      digest((user_salt || auth.uid()::text)::bytea, 'sha256'::text)
    ),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$function$;