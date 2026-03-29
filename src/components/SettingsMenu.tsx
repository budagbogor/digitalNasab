import React, { useState } from 'react';
import { Settings, X, Database, Save, Globe, Key, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';

export default function SettingsMenu({ currentUserRole }: { currentUserRole: string }) {
  if (currentUserRole !== 'admin') return null;

  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    updateSettings(localSettings);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-6 right-6 p-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl hover:bg-white/20 transition-all hover:scale-110 active:scale-95 group z-[100]"
      >
        <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-emerald-950/80 border border-emerald-500/30 rounded-[2.5rem] shadow-[0_0_50px_rgba(16,185,129,0.2)] overflow-hidden backdrop-blur-2xl"
            >
              <div className="bg-gradient-to-br from-emerald-800/50 to-emerald-950/50 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-400/30">
                      <Settings className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Pengaturan Global</h2>
                      <p className="text-emerald-400/60 text-sm">Konfigurasi API & Backend</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-white/50" />
                  </button>
                </div>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {/* Supabase Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-300 font-semibold px-1">
                      <Database className="w-4 h-4" />
                      <h3>Supabase Backend</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="relative group">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                          type="text"
                          placeholder="Supabase URL (misal: https://xyz.supabase.co)"
                          value={localSettings.supabaseUrl}
                          onChange={e => setLocalSettings(prev => ({ ...prev, supabaseUrl: e.target.value }))}
                          className="w-full bg-emerald-900/40 border border-emerald-800 focus:border-emerald-400 text-white px-12 py-4 rounded-2xl outline-none transition-all placeholder:text-emerald-700/50"
                        />
                      </div>
                      <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                          type="password"
                          placeholder="Supabase Anon Key"
                          value={localSettings.supabaseAnonKey}
                          onChange={e => setLocalSettings(prev => ({ ...prev, supabaseAnonKey: e.target.value }))}
                          className="w-full bg-emerald-900/40 border border-emerald-800 focus:border-emerald-400 text-white px-12 py-4 rounded-2xl outline-none transition-all placeholder:text-emerald-700/50"
                        />
                      </div>
                    </div>
                  </div>


                  {/* Family Update Password Section */}
                  <div className="space-y-4 pt-6 border-t border-emerald-500/10 mt-6">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold px-1">
                      <KeyRound className="w-4 h-4" />
                      <h3>Password Update Keluarga</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                          type="text"
                          placeholder="Password untuk Non-Admin"
                          value={localSettings.familyEditPassword}
                          onChange={e => setLocalSettings(prev => ({ ...prev, familyEditPassword: e.target.value }))}
                          className="w-full bg-emerald-900/40 border border-emerald-800 focus:border-amber-400 text-white px-12 py-4 rounded-2xl outline-none transition-all placeholder:text-emerald-700/50"
                        />
                      </div>
                      <p className="text-[10px] text-emerald-400/60 leading-relaxed px-1">
                        Berikan password ini kepada anggota keluarga yang ingin membantu memperbarui data tanpa akses Admin.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex flex-col gap-4">
                  <button
                    onClick={handleSave}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                  >
                    <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Simpan Konfigurasi
                  </button>

                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2 text-emerald-400 font-medium text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Konfigurasi diperbarui & tersimpan secara lokal.
                    </motion.div>
                  )}

                  <div className="flex items-start gap-2 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <AlertCircle className="w-5 h-5 text-emerald-500/40 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-emerald-500/40 leading-relaxed uppercase tracking-widest font-bold">
                      Semua API key disimpan secara aman di browser local storage Anda dan tidak pernah dikirim ke server pihak ketiga manapun (kecuali penyedia API terkait).
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
