import { useState, useRef, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { MessageSquare, X, Send, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { FamilyMember, AIConfig, AIModel } from '../types';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const MODEL_ORDER: AIModel[] = ['glm-5', 'seed-2.0-mini', 'seed-1.8', 'deepseek-3.2'];

export default function Chatbot({ members }: { members: FamilyMember[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Assalamu\'alaikum. Saya Asisten Nasab Anda. Ada yang ingin Anda tanyakan mengenai anggota keluarga Anda?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<AIModel | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync AI Config from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'ai'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as AIConfig;
        setAiConfig(data);
        setCurrentModel(data.defaultModel);
      }
    });
    return () => unsubscribe();
  }, []);

  const familyContext = members.map(m => {
    const father = members.find(f => f.id === m.parentId)?.fullName || 'Tidak diketahui';
    const mother = members.find(mo => mo.id === m.motherId)?.fullName || 'Tidak diketahui';
    const spouse = members.find(s => s.id === m.spouseId)?.fullName || 'Tidak diketahui';
    const children = members.filter(c => c.parentId === m.id || c.motherId === m.id).map(c => c.fullName).join(', ') || 'Tidak ada/Tidak diketahui';
    
    return `- Nama: ${m.fullName}
  Gender: ${m.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
  Status: ${m.isAlive ? 'Hidup' : 'Almarhum/ah'}
  Lahir: ${m.birthDate || '-'}
  Wafat: ${m.deathDate || '-'}
  Ayah: ${father}
  Ibu: ${mother}
  Pasangan: ${spouse}
  Anak: ${children}
  Bio: ${m.bio || '-'}`;
  }).join('\n\n');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callAI = async (model: AIModel, history: Message[]): Promise<string> => {
    if (!aiConfig) throw new Error('AI Configuration not loaded');

    const response = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: `Anda adalah "Asisten Nasab", asisten ahli silsilah keluarga digital.
            
TUGAS UTAMA:
1. Anda HANYA diperbolehkan menjawab pertanyaan berdasarkan data silsilah internal yang disediakan di bawah ini.
2. JANGAN menggunakan pengetahuan eksternal tentang tokoh sejarah atau keluarga lain kecuali jika ada dalam data.
3. Jika pengguna bertanya tentang seseorang yang TIDAK ada dalam data, jawablah dengan sopan bahwa orang tersebut tidak ditemukan dalam catatan silsilah saat ini.
4. Gunakan bahasa Indonesia yang sangat sopan, profesional, dan bernuansa Islami.
5. Jika ditanya tentang hubungan (misal: "Siapa kakek dari X?"), analisis data ayah/ibu secara mendalam untuk memberikan jawaban yang benar.

DATA SILSILAH KELUARGA SAAT INI:
${familyContext || 'Belum ada data anggota keluarga yang dimasukkan.'}`
          },
          ...history
        ],
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !aiConfig) return;

    const userMsg = input.trim();
    setInput('');
    setErrorStatus(null);
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    let modelToTry = aiConfig.defaultModel;
    let attemptCount = 0;
    const maxAttempts = aiConfig.autoSwitch ? MODEL_ORDER.length : 1;
    
    // Find index of starting model
    let currentIndex = MODEL_ORDER.indexOf(modelToTry);

    while (attemptCount < maxAttempts) {
      try {
        setCurrentModel(modelToTry);
        const text = await callAI(modelToTry, newMessages.filter(m => m.role !== 'system'));
        setMessages(prev => [...prev, { role: 'assistant', content: text }]);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error(`Error with model ${modelToTry}:`, error);
        attemptCount++;
        
        if (aiConfig.autoSwitch && attemptCount < maxAttempts) {
          // Switch to next model in order
          currentIndex = (currentIndex + 1) % MODEL_ORDER.length;
          modelToTry = MODEL_ORDER[currentIndex];
          setErrorStatus(`Model ${MODEL_ORDER[(currentIndex - 1 + MODEL_ORDER.length) % MODEL_ORDER.length]} gagal. Mencoba ${modelToTry}...`);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Mohon maaf, layanan AI sedang tidak tersedia atau API Key tidak valid. Silakan hubungi Admin.' }]);
          setIsLoading(false);
          setErrorStatus('Gagal menghubungkan ke layanan AI.');
          return;
        }
      }
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-emerald-600 text-white rounded-full shadow-xl hover:bg-emerald-700 transition-transform hover:scale-105 z-40 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <div className={`fixed bottom-6 right-6 w-[calc(100vw-3rem)] sm:max-w-[400px] h-[600px] max-h-[calc(100vh-8rem)] bg-white rounded-3xl shadow-2xl border border-emerald-100 flex flex-col z-50 transition-all duration-500 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-5 rounded-t-3xl flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-emerald-600/50 p-2 rounded-xl backdrop-blur-sm shadow-inner">
              <Sparkles className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-none">Asisten Nasab</h3>
              {aiConfig && (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-[10px] text-emerald-200 font-medium uppercase tracking-wider">{currentModel}</span>
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors relative z-10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-emerald-50/20 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-sm' 
                  : 'bg-white border border-emerald-100 text-gray-800 rounded-tl-sm'
              }`}>
                <div className="text-sm prose prose-sm prose-emerald max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white border border-emerald-100 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-3 text-emerald-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">{errorStatus ? 'Beralih Model...' : 'Mengetik...'}</span>
              </div>
            </div>
          )}
          {errorStatus && !isLoading && (
            <div className="flex justify-center">
              <div className="bg-amber-50 text-amber-700 text-[10px] px-3 py-1.5 rounded-full border border-amber-200 flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                {errorStatus}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-emerald-50 rounded-b-3xl">
          {!aiConfig?.apiKey ? (
            <div className="bg-red-50 p-3 rounded-2xl border border-red-100 text-center">
              <p className="text-[11px] text-red-600 font-medium">API Key belum dikonfigurasi oleh Admin.</p>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-100 p-1.5 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Tanya seputar silsilah..."
                className="flex-1 bg-transparent px-4 py-2 outline-none text-sm text-gray-700 placeholder:text-gray-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90 shadow-lg shadow-emerald-200"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
