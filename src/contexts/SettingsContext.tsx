import React, { createContext, useContext, useState, useEffect } from 'react';

interface Settings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  familyEditPassword: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  isConfigured: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  supabaseUrl: 'https://rjuhotqjxvrmzmuiripf.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqdWhvdHFqeHZybXptdWlyaXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MjEyMzUsImV4cCI6MjA5MDI5NzIzNX0.KXCyqhD_zjKw7vb33As1UvC7kYajy9o1yOZ-VKRnIH0',
  familyEditPassword: 'keluarga123',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('app_settings');
    if (!saved) return DEFAULT_SETTINGS;

    const parsedSaved = JSON.parse(saved);
    
    // Logika Migrasi Otomatis:
    // Jika DEFAULT_SETTINGS memiliki URL baru dan berbeda dengan yang tersimpan,
    // kita paksa gunakan yang baru agar sinkron dengan proyek Supabase terkini.
    if (DEFAULT_SETTINGS.supabaseUrl && parsedSaved.supabaseUrl !== DEFAULT_SETTINGS.supabaseUrl) {
      return { ...parsedSaved, ...DEFAULT_SETTINGS };
    }

    return { ...DEFAULT_SETTINGS, ...parsedSaved };
  });

  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const isConfigured = Boolean(
    settings.supabaseUrl && 
    settings.supabaseAnonKey
  );

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isConfigured }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
