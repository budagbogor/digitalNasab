import React, { useState, useEffect, useRef } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { ForumPost, ForumCategory } from '../types';
import { Send, MessageSquare, Calendar, Wallet, Users, Info, Loader2, Trash2, Bell } from 'lucide-react';

interface ForumViewProps {
  currentUser: any;
  isAdmin: boolean;
}

const CATEGORIES: { label: ForumCategory; icon: any; color: string }[] = [
  { label: 'Pengumuman', icon: Bell, color: 'emerald' },
  { label: 'Obrolan Umum', icon: MessageSquare, color: 'blue' },
  { label: 'Update Data', icon: Info, color: 'amber' },
  { label: 'Acara Keluarga', icon: Calendar, color: 'indigo' },
  { label: 'Urunan & Iuran', icon: Wallet, color: 'rose' },
];

export default function ForumView({ currentUser, isAdmin }: ForumViewProps) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [activeCategory, setActiveCategory] = useState<ForumCategory>('Pengumuman');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const supabase = getSupabaseClient();

  useEffect(() => {
    fetchPosts();

    // Setup Realtime Subscription
    const channel = supabase
      .channel('public:forum_posts')
      .on(
        'postgres_changes' as any,
        { event: '*', table: 'forum_posts', schema: 'public' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newPost = payload.new as ForumPost;
            setPosts((prev) => [newPost, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setPosts((prev) => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching forum posts:', error);
      } else {
        setPosts(data || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      const { error } = await supabase.from('forum_posts').insert([
        {
          user_id: currentUser.id,
          user_email: currentUser.email,
          content: newMessage.trim(),
          category: activeCategory,
        },
      ]);

      if (error) throw error;
      setNewMessage('');
    } catch (error: any) {
      alert('Gagal mengirim pesan: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!isAdmin && !confirm('Hapus pesan ini?')) return;
    
    const { error } = await supabase
      .from('forum_posts')
      .delete()
      .eq('id', postId);
    
    if (error) alert('Gagal menghapus pesan');
  };

  const filteredPosts = posts.filter(post => post.category === activeCategory);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-gray-50 rounded-2xl overflow-hidden border border-emerald-100 shadow-sm">
      {/* Category Tabs */}
      <div className="bg-white border-b border-gray-100 p-2 flex gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(cat.label)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeCategory === cat.label
                ? `bg-${cat.color}-100 text-${cat.color}-700 shadow-sm border border-${cat.color}-200`
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-emerald-600 gap-2">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-medium">Memuat obrolan...</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3 opacity-60">
            <div className="p-4 bg-gray-100 rounded-full">
              <MessageSquare className="w-8 h-8" />
            </div>
            <p className="text-sm">Belum ada obrolan di kategori ini.</p>
            <p className="text-xs text-center px-8">Jadilah yang pertama memulai silaturahmi!</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div 
              key={post.id} 
              className={`flex flex-col ${post.user_id === currentUser.id ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm border ${
                post.user_id === currentUser.id 
                  ? 'bg-emerald-600 text-white border-emerald-500 rounded-tr-none' 
                  : 'bg-white text-gray-800 border-gray-200 rounded-tl-none'
              }`}>
                {post.user_id !== currentUser.id && (
                  <p className="text-[10px] font-bold text-emerald-600 mb-1 uppercase tracking-wider">{post.user_email.split('@')[0]}</p>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                <div className={`flex items-center gap-2 mt-2 ${post.user_id === currentUser.id ? 'text-emerald-100' : 'text-gray-400'}`}>
                  <p className="text-[9px] font-medium italic">
                    {new Date(post.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {isAdmin && (
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <form onSubmit={handleSendMessage} className="flex gap-2 max-w-5xl mx-auto">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder={`Ketik pesan di ${activeCategory.toLowerCase()}...`}
            className="flex-1 bg-gray-50 border-2 border-emerald-50 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:ring-0 transition-all resize-none max-h-32"
            rows={1}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white p-4 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center shrink-0"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
        <p className="text-[10px] text-gray-400 mt-2 text-center font-medium">
          Dukung silaturahmi dengan bahasa yang sopan dan santun.
        </p>
      </div>
    </div>
  );
}
