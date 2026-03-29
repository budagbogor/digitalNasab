import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { GlobalSettings, UserRole } from '../types';
import { Shield, Save, Loader2, Cpu, Key } from 'lucide-react';

export default function SettingsView({ currentUserRole }: { currentUserRole: UserRole }) {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      if (data) {
        setSettings({
          id: data.id,
          aiProvider: data.ai_provider,
          sumopodApiKey: data.sumopod_api_key,
          updatedAt: data.updated_at
        });
      } else {
        // Default settings if none exist
        setSettings({
          id: 'global',
          aiProvider: 'gemini',
          sumopodApiKey: '',
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          id: 'global',
          ai_provider: settings.aiProvider,
          sumopod_api_key: settings.sumopodApiKey,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan secara global.' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan. Pastikan tabel "settings" sudah dibuat di Supabase.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (currentUserRole !== 'admin') {
    return (
      <div className="p-8 text-center">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Akses Ditolak</h2>
        <p className="text-gray-600">Hanya Admin yang dapat mengakses halaman pengaturan global.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Pengaturan Global</h2>
          <p className="text-gray-500 text-sm">Konfigurasi model AI dan parameter sistem lainnya.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm p-6 space-y-6">
            {/* AI Provider Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <Cpu className="w-5 h-5" />
                <h3>Model AI Utama</h3>
              </div>
              <p className="text-xs text-gray-500">Pilih model AI yang akan digunakan oleh Asisten Nasab (Chatbot).</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${settings?.aiProvider === 'gemini' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-emerald-200'}`}>
                  <input
                    type="radio"
                    name="aiProvider"
                    value="gemini"
                    checked={settings?.aiProvider === 'gemini'}
                    onChange={() => setSettings(s => s ? { ...s, aiProvider: 'gemini' } : null)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${settings?.aiProvider === 'gemini' ? 'border-emerald-500' : 'border-gray-300'}`}>
                    {settings?.aiProvider === 'gemini' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm">Google Gemini</div>
                    <div className="text-xs text-gray-500">Model bawaan (Flash 2.0)</div>
                  </div>
                </label>

                <label className={`relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${settings?.aiProvider === 'sumopod' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-emerald-200'}`}>
                  <input
                    type="radio"
                    name="aiProvider"
                    value="sumopod"
                    checked={settings?.aiProvider === 'sumopod'}
                    onChange={() => setSettings(s => s ? { ...s, aiProvider: 'sumopod' } : null)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${settings?.aiProvider === 'sumopod' ? 'border-emerald-500' : 'border-gray-300'}`}>
                    {settings?.aiProvider === 'sumopod' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm">Sumopod AI</div>
                    <div className="text-xs text-gray-500">Model alternatif</div>
                  </div>
                </label>
              </div>
            </div>

            <hr className="border-emerald-50" />

            {/* Sumopod API Key Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <Key className="w-5 h-5" />
                <h3>API Key Sumopod</h3>
              </div>
              <p className="text-xs text-gray-500">Masukkan API Key Sumopod Anda. Pengaturan ini akan digunakan secara global jika Sumopod dipilih sebagai provider.</p>
              
              <div className="relative">
                <input
                  type="password"
                  value={settings?.sumopodApiKey || ''}
                  onChange={(e) => setSettings(s => s ? { ...s, sumopodApiKey: e.target.value } : null)}
                  placeholder="Masukkan API Key Sumopod..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  disabled={settings?.aiProvider !== 'sumopod'}
                />
                {settings?.aiProvider !== 'sumopod' && (
                  <div className="absolute inset-0 bg-gray-50/50 cursor-not-allowed rounded-xl" />
                )}
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Simpan Perubahan
            </button>
          </div>
        </form>

        <div className="mt-12 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
          <h4 className="text-sm font-bold text-amber-800 mb-2">Informasi Penting:</h4>
          <ul className="text-xs text-amber-700 space-y-2 list-disc list-inside">
            <li>Pastikan Anda telah membuat tabel <strong>settings</strong> di database Supabase Anda dengan kolom: <code>id (text, primary key)</code>, <code>ai_provider (text)</code>, <code>sumopod_api_key (text)</code>, dan <code>updated_at (timestamp)</code>.</li>
            <li>Perubahan pengaturan ini akan berdampak langsung pada semua pengguna yang menggunakan fitur Chatbot.</li>
            <li>Jika menggunakan Gemini, pastikan <strong>GEMINI_API_KEY</strong> sudah terpasang di environment variables.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
