import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Settings hanya menyimpan Password Update Keluarga untuk sinkronisasi data non-admin.
 * Kredensial Supabase kini telah di-hardcode di lib/supabase.ts.
 */
interface Settings {
  familyEditPassword: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  isConfigured: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  familyEditPassword: 'keluarga123',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('app_settings_v2'); // Gunakan namespace baru untuk pembersihan
    if (!saved) return DEFAULT_SETTINGS;

    try {
      const parsedSaved = JSON.parse(saved);
      return { ...DEFAULT_SETTINGS, ...parsedSaved };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem('app_settings_v2', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Selalu true karena Supabase sudah di-hardcode
  const isConfigured = true;

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
