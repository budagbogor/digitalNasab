import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Helper to check if a string is a valid URL
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const supabaseUrl = isValidUrl(rawUrl) ? rawUrl! : 'https://lzabftyyltzqadhnuwwk.supabase.co';
const supabaseAnonKey = rawKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6YWJmdHl5bHR6cWFkaG51d3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MjM5MDksImV4cCI6MjA4OTk5OTkwOX0.wniv-nb6EKicN74e52Vx5Z8Je7HdVXLtU2tpjTgmN9o';

if (!isValidUrl(rawUrl) || !rawKey) {
  console.warn(
    'Supabase configuration is missing or invalid. Please set VITE_SUPABASE_URL (must be a valid URL) and VITE_SUPABASE_ANON_KEY in your environment variables.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
