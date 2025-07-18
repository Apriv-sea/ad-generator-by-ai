
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://lbmfkppvzimklebisefm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxibWZrcHB2emlta2xlYmlzZWZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NzMxNjksImV4cCI6MjA2MjA0OTE2OX0.KvytkathqcuvlnMYaF53J4LPVU3WDz5JNopYgyMG8F8";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
