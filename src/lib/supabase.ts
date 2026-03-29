import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Kredensial Supabase Permanen (Hardcoded)
const SUPABASE_URL = 'https://rjuhotqjxvrmzmuiripf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqdWhvdHFqeHZybXptdWlyaXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MjEyMzUsImV4cCI6MjA5MDI5NzIzNX0.KXCyqhD_zjKw7vb33As1UvC7kYajy9o1yOZ-VKRnIH0';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Mendapatkan instance Supabase Client (Singleton).
 * Sekarang menggunakan kredensial permanen yang sudah di-hardcode.
 */
export const getSupabaseClient = () => {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseInstance;
};

export type { SupabaseClient } from '@supabase/supabase-js';
