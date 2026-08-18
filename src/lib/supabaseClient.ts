import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'premier_predictor_custom_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  source: 'custom' | 'env' | 'none';
}

function loadConfig(): SupabaseConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return {
          url: parsed.url.trim().replace(/\/+$/, ''),
          anonKey: parsed.anonKey.trim(),
          source: 'custom',
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse custom Supabase config:', e);
  }

  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (envUrl && envKey && !envUrl.includes('placeholder') && envUrl !== 'https://your-project.supabase.co') {
    return {
      url: envUrl,
      anonKey: envKey,
      source: 'env',
    };
  }

  return {
    url: '',
    anonKey: '',
    source: 'none',
  };
}

let currentConfig = loadConfig();

export function getSupabaseConfig(): SupabaseConfig {
  return loadConfig();
}

export function isValidSupabaseUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  return (clean.startsWith('https://') || clean.startsWith('http://')) && clean.length > 10;
}

export let supabase: SupabaseClient | null = null;
export let isSupabaseConfigured = false;

export function initClient(): SupabaseClient | null {
  currentConfig = loadConfig();
  if (currentConfig.url && currentConfig.anonKey && isValidSupabaseUrl(currentConfig.url)) {
    try {
      supabase = createClient(currentConfig.url, currentConfig.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      isSupabaseConfigured = true;
      return supabase;
    } catch (err) {
      console.warn('Could not initialize Supabase client:', err);
      supabase = null;
      isSupabaseConfigured = false;
      return null;
    }
  } else {
    supabase = null;
    isSupabaseConfigured = false;
    return null;
  }
}

// Initial client creation
initClient();

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabase) {
    initClient();
  }
  return supabase;
}

export function getIsSupabaseConfigured(): boolean {
  const client = getSupabaseClient();
  return Boolean(client && isSupabaseConfigured);
}

export function reconfigureSupabase(url: string, anonKey: string): { success: boolean; error?: string } {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  const cleanKey = anonKey.trim();

  if (!cleanUrl || !cleanKey) {
    return { success: false, error: 'Both Supabase Project URL and Anon API Key are required.' };
  }

  if (!isValidSupabaseUrl(cleanUrl)) {
    return { success: false, error: 'Project URL must start with https:// (e.g. https://your-project.supabase.co)' };
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ url: cleanUrl, anonKey: cleanKey }));
    initClient();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save configuration.' };
  }
}

export function resetSupabaseConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
  initClient();
}

export function getSupabaseStatus() {
  const cfg = getSupabaseConfig();
  const configured = getIsSupabaseConfigured();
  return {
    isConfigured: configured,
    url: cfg.url ? cfg.url.replace(/^(https:\/\/[^.]+).*/, '$1.supabase.co') : 'Not set',
    rawUrl: cfg.url,
    anonKey: cfg.anonKey,
    hasKey: Boolean(cfg.anonKey),
    source: cfg.source,
  };
}

