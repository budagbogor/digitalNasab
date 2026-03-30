import { useState, useEffect } from 'react';
import { getSupabaseClient } from './lib/supabase';
import { FamilyMember, NewFamilyMember, UserRole } from './types';
import Auth from './components/Auth';
import TreeView from './components/TreeView';
import DirectoryView from './components/DirectoryView';
import UserManagement from './components/UserManagement';
import SettingsMenu from './components/SettingsMenu';
import MemberModal from './components/MemberModal';
import ProfileModal from './components/ProfileModal';
import Chatbot from './components/Chatbot';
import ExcelImport from './components/ExcelImport';
import StatsView from './components/StatsView';
import IslamicWelcome from './components/IslamicWelcome';
import ForumView from './components/ForumView';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { 
  LogOut, Plus, Users, Loader2, LayoutGrid, List, 
  BarChart2, ShieldCheck, MessageSquare, CheckCircle2, AlertCircle, X 
} from 'lucide-react';

function AppContent() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>('viewer');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tree' | 'directory' | 'users' | 'stats' | 'forum'>('tree');
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  
  const { isConfigured } = useSettings();

  // Auth & Session Management
  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    const client = getSupabaseClient();
    
    client.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) setIsLoading(false);
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setUserRole('viewer');
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isConfigured]);

  // Fetch User Role & Data
  useEffect(() => {
    if (!user || !isConfigured) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const client = getSupabaseClient();
        
        // 1. Fetch Role
        const { data: roleData } = await client
          .from('users')
          .select('role')
          .eq('uid', user.id)
          .single();

        if (roleData) setUserRole(roleData.role as UserRole);

        // 2. Fetch Members
        const { data: memberData } = await client
          .from('family_members')
          .select('*')
          .order('fullName');

        if (memberData) setMembers(memberData as FamilyMember[]);
      } catch (err) {
        console.error('Error fetching initial data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Subscribe to changes
    const client = getSupabaseClient();
    const channel = (client.channel('schema-db-changes') as any)
      .on('postgres_changes', { event: '*', table: 'family_members', schema: 'public' }, () => fetchData())
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [user, isConfigured]);

  const handleSaveMember = async (memberData: NewFamilyMember | FamilyMember) => {
    try {
      const client = getSupabaseClient();
      if (editingMember) {
        const { error } = await client
          .from('family_members')
          .update({ ...memberData, updatedAt: new Date().toISOString() })
          .eq('id', editingMember.id);
        if (error) throw error;
      } else {
        const { error } = await client
          .from('family_members')
          .insert([{ ...memberData, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
        if (error) throw error;
      }
      setIsMemberModalOpen(false);
      setEditingMember(null);
      setSaveMessage({ text: `Berhasil ${editingMember ? 'memperbarui' : 'menambahkan'} data!`, type: 'success' });
      setTimeout(() => setSaveMessage({ text: '', type: '' }), 4000);
    } catch (error: any) {
      console.error('Error saving member:', error);
      const errorMsg = error.message || error.details || 'Gagal menyimpan data.';
      setSaveMessage({ text: `Kesalahan: ${errorMsg}`, type: 'error' });
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!window.confirm('Hapus anggota ini selamanya?')) return;
    try {
      const client = getSupabaseClient();
      const { error } = await client.from('family_members').delete().eq('id', id);
      if (error) throw error;
      setIsProfileModalOpen(false);
      setSelectedMember(null);
      setSaveMessage({ text: 'Data anggota berhasil dihapus!', type: 'success' });
      setTimeout(() => setSaveMessage({ text: '', type: '' }), 4000);
    } catch (error: any) {
      console.error('Error deleting member:', error);
      setSaveMessage({ text: `Gagal Menghapus: ${error.message || 'Kesalahan'}`, type: 'error' });
    }
  };

  const handleNodeClick = (member: FamilyMember) => {
    setSelectedMember(member);
    setIsProfileModalOpen(true);
  };

  const handleEditClick = (member: FamilyMember) => {
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {!hasSeenWelcome && <IslamicWelcome onComplete={() => setHasSeenWelcome(true)} />}

      {/* Header */}
      <header className="bg-emerald-900 text-white shadow-2xl z-20 sticky top-0 border-b border-emerald-800/50">
        <div className="max-w-7xl mx-auto px-4 h-auto lg:h-20 py-3 lg:py-0">
          <div className="flex flex-col lg:flex-row items-center justify-between h-full gap-4 lg:gap-6">
            
            {/* 1. BRAND AREA (LOGO) - LEFT */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-emerald-700 p-2 rounded-xl shadow-inner border border-emerald-600/50 transform -rotate-2 hover:rotate-0 transition-all duration-300">
                <Users className="w-6 h-6 text-emerald-100" />
              </div>
              <div className="text-right flex flex-col justify-center min-w-[120px]" dir="rtl">
                <h1 className="text-2xl md:text-3xl font-normal tracking-tight leading-7 drop-shadow-sm font-arabic m-0">شجرة النسب الرقمية</h1>
                <p className="text-[10px] md:text-xs text-emerald-400 font-medium tracking-normal opacity-90 font-arabic m-0 -mt-1">سلسلة إيـمـan ديـهـارجـو</p>
              </div>
            </div>

            {/* 2. NAVIGATION CENTER */}
            <div className="flex justify-center flex-1 min-w-0">
              <div className="flex items-center bg-emerald-950/40 backdrop-blur-md rounded-xl p-1 border border-emerald-700/30 shadow-inner max-sm:overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-0.5 min-w-max">
                  <button
                    onClick={() => setViewMode('tree')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 ${
                      viewMode === 'tree' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Silsilah</span>
                  </button>
                  <button
                    onClick={() => setViewMode('directory')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 ${
                      viewMode === 'directory' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Direktori</span>
                  </button>
                  <button
                    onClick={() => setViewMode('stats')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 ${
                      viewMode === 'stats' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Statistik</span>
                  </button>
                  <button
                    onClick={() => setViewMode('forum')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 ${
                      viewMode === 'forum' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Forum</span>
                  </button>
                  {userRole === 'admin' && (
                    <button
                      onClick={() => setViewMode('users')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 ${
                        viewMode === 'users' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Akses</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 3. ACTION AREA RIGHT */}
            <div className="flex items-center gap-2 lg:gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="hidden xl:flex flex-col items-end pr-3 border-r border-emerald-800/50">
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-0.5">
                    {userRole === 'admin' ? 'Administrator' : 'Keluarga'}
                  </span>
                  <span className="text-[10px] font-medium text-white/70 truncate max-w-[100px]">
                    {user?.email}
                  </span>
                </div>

                {userRole === 'admin' && (
                  <div className="flex items-center gap-1.5">
                    <ExcelImport userId={user?.id || 'admin'} currentUserRole={userRole} isCompact={true} />
                    <button
                      onClick={() => { setEditingMember(null); setIsMemberModalOpen(true); }}
                      className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-amber-950 px-2 py-1.5 rounded-lg text-[10px] font-black transition-all shadow-md active:scale-95 border border-amber-400/50 uppercase whitespace-nowrap"
                      title="Tambah Data Anggota"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden md:inline lg:hidden xl:inline">Tambah Data</span>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 pl-2 border-l border-emerald-800/50">
                <SettingsMenu currentUserRole={userRole} />
                <button 
                  onClick={() => getSupabaseClient().auth.signOut()}
                  className="p-2 text-emerald-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4 md:w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {!isConfigured ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white/50 backdrop-blur-md">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl rotate-3">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Konfigurasi Diperlukan</h2>
            <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
              Selamat datang di Digital Nasab. Untuk memulai, silakan masukkan API Key Supabase Anda melalui menu pengaturan di pojok kanan atas.
            </p>
          </div>
        ) : isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 backdrop-blur-sm z-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : members.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Users className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pohon Keluarga Kosong</h2>
            <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
              Mulai bangun silsilah keluarga Anda dengan menambahkan anggota pertama atau mengimpor data melalui menu di atas.
            </p>
            {userRole === 'admin' && (
              <button
                onClick={() => { setEditingMember(null); setIsMemberModalOpen(true); }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200"
              >
                <Plus className="w-5 h-5" />
                Tambah Anggota Pertama
              </button>
            )}
          </div>
        ) : viewMode === 'tree' ? (
          <TreeView 
            members={members} 
            onNodeClick={handleNodeClick} 
            onEditClick={handleEditClick} 
            currentUserRole={userRole} 
          />
        ) : viewMode === 'directory' ? (
          <DirectoryView 
            members={members} 
            onEdit={handleEditClick} 
            onDelete={handleDeleteMember} 
            onMemberClick={handleNodeClick}
            currentUserRole={userRole} 
          />
        ) : viewMode === 'stats' ? (
          <StatsView members={members} />
        ) : viewMode === 'forum' ? (
          <ForumView currentUser={user} isAdmin={userRole === 'admin'} />
        ) : (
          <UserManagement currentUserRole={userRole} />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 bg-white border-t border-gray-100 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-xs font-medium tracking-wider uppercase">
            &copy; 2026 b.o.a. Indonesia
          </p>
          <div className="flex items-center gap-6">
            <span className="h-1 w-1 bg-gray-300 rounded-full hidden md:block"></span>
            <p className="text-[10px] text-gray-300 italic font-light">
              Digital Nasab - Silsilah Iman Diharjo
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => { setIsMemberModalOpen(false); setEditingMember(null); }}
        onSave={handleSaveMember}
        editingMember={editingMember}
        members={members}
      />
      
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        member={selectedMember}
        members={members}
        onEdit={handleEditClick}
        onDelete={handleDeleteMember}
        currentUserRole={userRole}
      />

      <Chatbot />

      {/* Global Toast Notification */}
      {saveMessage.text && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300 border ${
          saveMessage.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 
          saveMessage.type === 'error' ? 'bg-red-600 text-white border-red-500' : 'bg-gray-800 text-white border-gray-700'
        }`}>
          {saveMessage.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
          {saveMessage.type === 'error' && <AlertCircle className="w-6 h-6" />}
          <div className="flex flex-col">
            <span className="font-black text-xs uppercase tracking-widest opacity-70 leading-tight mb-0.5">Notifikasi</span>
            <span className="font-bold text-sm tracking-tight">{saveMessage.text}</span>
          </div>
          <button 
            onClick={() => setSaveMessage({ text: '', type: '' })}
            className="ml-4 hover:bg-white/20 p-1.5 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}
