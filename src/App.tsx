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
  BarChart2, ShieldCheck, MessageSquare 
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
    } catch (error) {
      console.error('Error saving member:', error);
      alert('Gagal menyimpan data.');
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
    } catch (error) {
      console.error('Error deleting member:', error);
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

  const navItems = [
    { id: 'tree', label: 'Silsilah', icon: LayoutGrid },
    { id: 'directory', label: 'Direktori', icon: List },
    { id: 'stats', label: 'Statistik', icon: BarChart2 },
    { id: 'forum', label: 'Forum', icon: MessageSquare },
    ...(userRole === 'admin' ? [{ id: 'users', label: 'Akses', icon: ShieldCheck }] : []),
  ];

  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans mb-20 lg:mb-0">
      {!hasSeenWelcome && <IslamicWelcome onComplete={() => setHasSeenWelcome(true)} />}

      {/* Header - Optimized for Mobile */}
      <header className="bg-emerald-900 text-white shadow-2xl z-20 sticky top-0 border-b border-emerald-800/50">
        <div className="max-w-7xl mx-auto px-4 h-16 lg:h-20 flex items-center justify-between">
            
            {/* BRAND AREA - LEFT */}
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="bg-emerald-700 p-1.5 lg:p-2 rounded-lg lg:rounded-xl shadow-inner border border-emerald-600/50 transform -rotate-1 hover:rotate-0 transition-all duration-300 shrink-0">
                <Users className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-100" />
              </div>
              <div className="text-right flex flex-col justify-center min-w-[100px] lg:min-w-[120px]" dir="rtl">
                <h1 className="text-xl lg:text-3xl font-normal tracking-tight leading-none drop-shadow-sm font-arabic m-0">شجرة النسب</h1>
                <p className="text-[8px] lg:text-xs text-emerald-400 font-medium tracking-normal opacity-90 font-arabic m-0">سلسلة إيـمـan ديـهـargو</p>
              </div>
            </div>

            {/* NAVIGATION CENTER - Hidden on Mobile */}
            <div className="hidden lg:flex justify-center flex-1 mx-4">
              <div className="flex items-center bg-emerald-950/40 backdrop-blur-md rounded-xl p-1 border border-emerald-700/30 shadow-inner">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setViewMode(item.id as any)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                      viewMode === item.id ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ACTION AREA RIGHT */}
            <div className="flex items-center gap-2 lg:gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {userRole === 'admin' && (
                  <>
                    <ExcelImport userId={user?.id || 'admin'} currentUserRole={userRole} isCompact={true} />
                    <button
                      onClick={() => { setEditingMember(null); setIsMemberModalOpen(true); }}
                      className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 px-2 lg:px-3 py-1.5 rounded-lg text-[10px] font-black transition-all shadow-md active:scale-95 border border-amber-400/50"
                      title="Tambah Data"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden lg:inline uppercase">Tambah Data</span>
                    </button>
                  </>
                )}
                
                <div className="flex items-center gap-1.5 ml-1 lg:ml-2 pl-2 lg:pl-3 border-l border-emerald-800/50">
                  <SettingsMenu currentUserRole={userRole} />
                  <button 
                    onClick={() => getSupabaseClient().auth.signOut()}
                    className="p-2 text-emerald-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    title="Keluar"
                  >
                    <LogOut className="w-4 h-4 lg:w-5 lg:h-5" />
                  </button>
                </div>
              </div>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden pb-16 lg:pb-0">
        {!isConfigured ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white/50 backdrop-blur-md">
            <div className="w-16 lg:w-20 h-16 lg:h-20 bg-amber-100 text-amber-600 rounded-2xl lg:rounded-3xl flex items-center justify-center mb-6 shadow-xl rotate-3">
              <ShieldCheck className="w-8 h-8 lg:w-10 lg:h-10" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-4 tracking-tight">Konfigurasi Diperlukan</h2>
            <p className="text-gray-500 max-w-md mb-8 leading-relaxed text-sm">
              Server belum terkonfigurasi dengan benar. Silakan hubungi Administrator.
            </p>
          </div>
        ) : isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 backdrop-blur-sm z-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : members.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 lg:w-24 h-20 lg:h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Users className="w-10 lg:w-12 h-10 lg:h-12" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Pohon Keluarga Kosong</h2>
            {userRole === 'admin' && (
              <button
                onClick={() => { setEditingMember(null); setIsMemberModalOpen(true); }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Tambah Anggota Pertama
              </button>
            )}
          </div>
        ) : viewMode === 'tree' ? (
          <TreeView members={members} onNodeClick={handleNodeClick} onEditClick={handleEditClick} currentUserRole={userRole} />
        ) : viewMode === 'directory' ? (
          <DirectoryView members={members} onEdit={handleEditClick} onDelete={handleDeleteMember} onMemberClick={handleNodeClick} currentUserRole={userRole} />
        ) : viewMode === 'stats' ? (
          <StatsView members={members} />
        ) : viewMode === 'forum' ? (
          <ForumView currentUser={user} isAdmin={userRole === 'admin'} />
        ) : (
          <UserManagement currentUserRole={userRole} />
        )}
      </main>

      {/* Bottom Navigation - Only for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-emerald-900/95 backdrop-blur-lg border-t border-emerald-800/50 z-50 px-2 pb-safe-area-inset-bottom">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setViewMode(item.id as any)}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 ${
                viewMode === item.id ? 'text-white' : 'text-emerald-400 opacity-60'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${viewMode === item.id ? 'bg-emerald-600 shadow-md scale-110' : ''}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Footer - Desktop Only */}
      <footer className="hidden lg:block py-6 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <p className="text-gray-400 text-xs font-medium tracking-wider uppercase">
            &copy; 2026 b.o.a. Indonesia
          </p>
          <div className="flex items-center gap-6">
            <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
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
