import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let currentUrl: string | null = null;

/**
 * Mendapatkan instance Supabase Client (Singleton).
 * Fungsi ini memastikan hanya ada satu GoTrueClient yang berjalan di browser,
 * dan secara otomatis melakukan re-init jika konfigurasi URL berubah.
 */
export const getSupabaseClient = () => {
    const saved = localStorage.getItem('app_settings');
    const settings = saved ? JSON.parse(saved) : null;

    const url = settings?.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
    const anonKey = settings?.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

    // Jika instance sudah ada dan URL-nya sama, kembalikan instance yang sama
    if (supabaseInstance && currentUrl === url) {
        return supabaseInstance;
    }

    // Jika URL berubah (misal: user update API Key) atau belum ada instance, buat baru
    currentUrl = url;
    supabaseInstance = createClient(url, anonKey);
    return supabaseInstance;
};

export type { SupabaseClient } from '@supabase/supabase-js';
