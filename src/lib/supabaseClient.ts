import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Could not initialize real Supabase client, falling back to local engine:', err);
    supabase = null;
  }
}

export function getSupabaseStatus() {
  return {
    isConfigured: isSupabaseConfigured,
    url: supabaseUrl ? supabaseUrl.replace(/^(https:\/\/[^.]+).*/, '$1.supabase.co') : 'Not set',
    hasKey: Boolean(supabaseAnonKey),
  };
}
