import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Assalamu\'alaikum. Saya asisten Digital Nasab Anda. Ada yang bisa saya bantu terkait silsilah keluarga atau sejarah nasab?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && !chatRef.current) {
      chatRef.current = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: 'Anda adalah asisten ahli nasab (silsilah keluarga) Islami. Gunakan bahasa Indonesia yang sopan, profesional, dan bernuansa Islami. Berikan jawaban yang akurat berdasarkan standar genealogi dan sejarah Islam jika ditanya. Jika pengguna bertanya tentang cara menggunakan aplikasi, jelaskan bahwa ini adalah aplikasi Digital Nasab untuk mencatat silsilah keluarga.',
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', content: response.text }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', content: 'Mohon maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-emerald-600 text-white rounded-full shadow-xl hover:bg-emerald-700 transition-transform hover:scale-105 z-40 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 w-full max-w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-emerald-100 flex flex-col z-50 transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        {/* Header */}
        <div className="bg-emerald-700 text-white p-4 rounded-t-2xl flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <h3 className="font-semibold">Asisten Nasab</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-emerald-600 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-emerald-50/30">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-white border border-emerald-100 text-gray-800 rounded-tl-sm shadow-sm'}`}>
                <div className="text-sm prose prose-sm prose-emerald max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-emerald-100 p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2 text-emerald-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Mengetik...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-emerald-100 rounded-b-2xl">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 p-1 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Tanya seputar nasab..."
              className="flex-1 bg-transparent px-3 py-2 outline-none text-sm text-gray-700"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
