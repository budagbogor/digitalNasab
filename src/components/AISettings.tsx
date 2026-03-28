import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AIConfig, AIModel } from '../types';
import { Settings, Save, Sparkles, AlertCircle, CheckCircle2, Loader2, Cpu } from 'lucide-react';

const MODELS: { id: AIModel; name: string; description: string; price: string }[] = [
  { id: 'glm-5', name: 'GLM 5', description: 'Termurah & Cepat', price: 'Econ' },
  { id: 'seed-2.0-mini', name: 'Seed 2.0 Mini', description: 'Ringan & Efisien', price: 'Low' },
  { id: 'seed-1.8', name: 'Seed 1.8', description: 'Keseimbangan Kualitas', price: 'Mid' },
  { id: 'deepseek-3.2', name: 'DeepSeek 3.2', description: 'Terbaik & Cerdas', price: 'High' },
];

export default function AISettings() {
  const [config, setConfig] = useState<AIConfig>({
    apiKey: '',
    baseUrl: 'https://ai.sumopod.com/v1',
    defaultModel: 'glm-5',
    autoSwitch: true,
    updatedAt: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'settings', 'ai');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data() as AIConfig);
        }
      } catch (error) {
        console.error('Error fetching AI config:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      await setDoc(doc(db, 'settings', 'ai'), {
        ...config,
        updatedAt: new Date(),
      });
      setMessage({ type: 'success', text: 'Konfigurasi AI berhasil disimpan dan diterapkan secara global.' });
    } catch (error) {
      console.error('Error saving AI config:', error);
      setMessage({ type: 'error', text: 'Gagal menyimpan konfigurasi. Pastikan Anda memiliki hak akses Admin.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 px-8 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Pengaturan Sumopod AI</h2>
              <p className="text-emerald-100 text-sm opacity-90">Konfigurasi AI Global untuk Seluruh Pengguna</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-8">
          {message && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* API Key Section */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700 ml-1">Sumopod API Key</label>
              <div className="relative">
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-400 ml-1">Dapatkan di <a href="https://sumopod.com/dashboard/ai" target="_blank" className="text-emerald-600 hover:underline">Sumopod Dashboard</a></p>
            </div>

            {/* Base URL Section */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700 ml-1">Base URL API</label>
              <input
                type="text"
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-6">
            <label className="block text-sm font-bold text-gray-700 ml-1">Pilih Model Utama</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => setConfig({ ...config, defaultModel: model.id })}
                  className={`group relative flex flex-col p-4 rounded-2xl border-2 text-left transition-all duration-300 ${
                    config.defaultModel === model.id
                      ? 'border-emerald-600 bg-emerald-50 ring-4 ring-emerald-500/10'
                      : 'border-gray-100 bg-white hover:border-emerald-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className={`p-1.5 rounded-lg ${config.defaultModel === model.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-emerald-100'}`}>
                      <Cpu className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      model.price === 'Econ' ? 'bg-blue-100 text-blue-700' :
                      model.price === 'Low' ? 'bg-teal-100 text-teal-700' :
                      model.price === 'Mid' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {model.price}
                    </span>
                  </div>
                  <h4 className={`font-bold text-sm ${config.defaultModel === model.id ? 'text-emerald-900' : 'text-gray-900'}`}>{model.name}</h4>
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{model.description}</p>
                  
                  {config.defaultModel === model.id && (
                    <div className="absolute -top-2 -right-2 bg-emerald-600 text-white rounded-full p-1 shadow-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={config.autoSwitch}
                  onChange={(e) => setConfig({ ...config, autoSwitch: e.target.checked })}
                />
                <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none ring-0 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ms-3 text-sm font-bold text-gray-700">Auto-Switch Model Cerdas</span>
              </label>
              <div className="group relative">
                <AlertCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-gray-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-xl z-50">
                  Jika aktif, AI akan otomatis mencoba model lain jika model utama gagal merespons atau limit tercapai.
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving || !config.apiKey}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-200 active:scale-95"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>Simpan Konfigurasi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
