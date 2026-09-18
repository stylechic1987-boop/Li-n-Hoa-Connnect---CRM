import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || "https://zhyrbdhpbkeldizevkzi.supabase.co";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || "sb_publishable_0KwIF-WZBpLaawyWgphAHw_1xbCJVVX";

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = supabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
}) : null;
