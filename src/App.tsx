import { useState, useEffect } from 'react';
import { getSupabaseClient } from './lib/supabase';
// ... sisanya tetap sama
import { FamilyMember, NewFamilyMember, UserRole } from './types';
import Auth from './components/Auth';
import TreeView from './components/TreeView';
import DirectoryView from './components/DirectoryView';
import UserManagement from './components/UserManagement';
import MemberModal from './components/MemberModal';
import ProfileModal from './components/ProfileModal';
import Chatbot from './components/Chatbot';
import ExcelImport from './components/ExcelImport';
import StatsView from './components/StatsView';
import SettingsMenu from './components/SettingsMenu';
import IslamicWelcome from './components/IslamicWelcome';
import ForumView from './components/ForumView';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { LogOut, Plus, Users, Loader2, LayoutGrid, List, BarChart2, ShieldCheck, Share2, MessageSquare } from 'lucide-react';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Share2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Ada Masalah</h2>
        <p className="text-gray-600 mb-6">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
        >
          Muat Ulang Aplikasi
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>('viewer'); // Default adalah viewer demi keamanan
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tree' | 'directory' | 'users' | 'stats' | 'forum'>('tree');
  const [appError, setAppError] = useState<Error | null>(null);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const { settings, isConfigured } = useSettings();

  useEffect(() => {
    if (!isConfigured) return;

    const client = getSupabaseClient();
    
    // Check session
    client.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setUserRole('viewer');
    });

    return () => subscription.unsubscribe();
  }, [isConfigured]);

  // Fetch User Role
  useEffect(() => {
    if (!user || !isConfigured) return;

    const fetchRole = async () => {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('users')
        .select('role')
        .eq('uid', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
      } else if (data) {
        setUserRole(data.role as UserRole);
      }
    };

    fetchRole();
  }, [user, isConfigured]);

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    const client = getSupabaseClient();
    
    // Fetch members
    const fetchMembers = async () => {
      setIsLoading(true);
      const { data, error } = await client
        .from('family_members')
        .select('*')
        .order('fullName', { ascending: true });

      if (error) {
        console.error('Error fetching members:', error);
      } else {
        setMembers(data as FamilyMember[]);
      }
      setIsLoading(false);
    };

    fetchMembers();

    // Realtime subscription
    const channel = client
      .channel('family_members_changes')
      .on('postgres_changes' as any, { event: '*', table: 'family_members' }, () => {
        fetchMembers();
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [isConfigured]);

  const handleSaveMember = async (memberData: NewFamilyMember | FamilyMember) => {
    // Catatan: Izin edit untuk viewer sekarang diverifikasi menggunakan password di handleEditClick
    // Admin tetap memiliki akses penuh tanpa password.
    
    const client = getSupabaseClient();
    const dataToSave = {
      ...memberData,
      fullName: memberData.fullName.toUpperCase(),
      updatedAt: new Date().toISOString(),
      // Pastikan UUID tidak dikirim sebagai string kosong "" karena akan ditolak Database
      parentId: memberData.parentId || null,
      motherId: memberData.motherId || null,
      spouseId: memberData.spouseId || null,
    };

    try {
      if ('id' in memberData && memberData.id) {
        // Update
        const { error } = await client
          .from('family_members')
          .update(dataToSave)
          .eq('id', memberData.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await client
          .from('family_members')
          .insert([{ ...dataToSave, createdAt: new Date().toISOString() }]);
        if (error) throw error;
      }

      setIsMemberModalOpen(false);
      setEditingMember(null);
    } catch (error: any) {
      setAppError(new Error(error.message));
    }
  };

  const handleEditClick = (member: FamilyMember) => {
    const { familyEditPassword } = settings;
    
    if (userRole !== 'admin') {
      const inputPassword = prompt(`Masukkan Password Update Keluarga untuk mengedit data ${member.fullName}:`);
      if (inputPassword !== familyEditPassword) {
        alert('Password Salah! Silakan hubungi Admin untuk mendapatkan password update.');
        return;
      }
    }
    
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  const handleDeleteMember = async (memberId: string) => {
    if (userRole !== 'admin') {
      alert('Akses Ditolak: Hanya Admin yang dapat menghapus data.');
      return;
    }

    const client = getSupabaseClient();
    try {
      const { error } = await client
        .from('family_members')
        .delete()
        .eq('id', memberId);
      if (error) throw error;
      setIsProfileModalOpen(false);
    } catch (error: any) {
      setAppError(new Error(error.message));
    }
  };

  const handleNodeClick = (member: FamilyMember) => {
    setSelectedMember(member);
    setIsProfileModalOpen(true);
  };

  if (appError) {
    return <ErrorFallback error={appError} />;
  }

  // Tampilkan layar Login jika belum masuk
  if (!user && isConfigured) {
    return <Auth />;
  }

  // Tampilkan Animasi Pembuka Islami jika baru masuk
  if (user && !hasSeenWelcome && isConfigured) {
    return <IslamicWelcome onComplete={() => setHasSeenWelcome(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <SettingsMenu currentUserRole={userRole} />
      
      {/* Header */}
      <header className="bg-emerald-900 text-white shadow-2xl z-20 sticky top-0 border-b border-emerald-800/50">
        <div className="max-w-7xl mx-auto px-4 h-auto lg:h-20 py-3 lg:py-0">
          <div className="flex flex-col lg:grid lg:grid-cols-3 items-center h-full gap-4 lg:gap-0">
            
            {/* 1. BRAND AREA (LOGO) - LEFT */}
            <div className="flex items-center gap-3 w-full lg:w-auto justify-center lg:justify-start">
              <div className="bg-emerald-700 p-2 rounded-xl shadow-inner border border-emerald-600/50 transform -rotate-2 hover:rotate-0 transition-all duration-300 shrink-0">
                <Users className="w-6 h-6 text-emerald-100" />
              </div>
              <div className="text-right flex flex-col justify-center min-w-[120px]" dir="rtl">
                <h1 className="text-2xl md:text-3xl font-normal tracking-tight leading-7 drop-shadow-sm font-arabic m-0">شجرة النسب الرقمية</h1>
                <p className="text-[10px] md:text-xs text-emerald-400 font-medium tracking-normal opacity-90 font-arabic m-0 -mt-1">سلسلة إيـمـan ديـهـارجـو</p>
              </div>
            </div>

            {/* 2. NAVIGATION CENTER */}
            <div className="flex justify-center w-full">
              <div className="flex items-center bg-emerald-950/40 backdrop-blur-md rounded-xl p-1 border border-emerald-700/30 shadow-inner max-sm:overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-0.5 min-w-max">
                  <button
                    onClick={() => setViewMode('tree')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 ${
                      viewMode === 'tree' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Silsilah</span>
                  </button>
                  <button
                    onClick={() => setViewMode('directory')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 ${
                      viewMode === 'directory' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Direktori</span>
                  </button>
                  <button
                    onClick={() => setViewMode('stats')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 ${
                      viewMode === 'stats' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Statistik</span>
                  </button>
                  <button
                    onClick={() => setViewMode('forum')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 ${
                      viewMode === 'forum' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Forum</span>
                  </button>
                  {userRole === 'admin' && (
                    <button
                      onClick={() => setViewMode('users')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 ${
                        viewMode === 'users' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Akses</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 3. ACTION AREA RIGHT */}
            <div className="flex items-center gap-3 w-full lg:w-auto justify-center lg:justify-end">
              <div className="flex items-center gap-3 shrink-0">
                {/* User Identity Info */}
                <div className="hidden sm:flex flex-col items-end pr-2 border-r border-emerald-800/50">
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-0.5">
                    {userRole === 'admin' ? 'Administrator' : 'Keluarga'}
                  </span>
                  <span className="text-[10px] font-medium text-white/60 truncate max-w-[120px]">
                    {user?.email}
                  </span>
                </div>

                {userRole === 'admin' && (
                  <div className="flex items-center gap-1.5">
                    <ExcelImport userId={user?.id || 'admin'} currentUserRole={userRole} isCompact={true} />
                    <button
                      onClick={() => { setEditingMember(null); setIsMemberModalOpen(true); }}
                      className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-amber-950 px-2 py-1.5 rounded-lg text-[10px] font-black transition-all shadow-md active:scale-95 border border-amber-400/50 uppercase"
                      title="Tambah Data Anggota"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">Tambah Data</span>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 pl-2 lg:border-l border-emerald-800/50">
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
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-50/50 backdrop-blur-sm z-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : members.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Users className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pohon Keluarga Kosong</h2>
            <p className="text-gray-500 max-w-md mb-8">
              Mulai bangun silsilah keluarga Anda dengan menambahkan anggota pertama.
            </p>
            <button
              onClick={() => { setEditingMember(null); setIsMemberModalOpen(true); }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-200"
            >
              <Plus className="w-5 h-5" />
              Tambah Anggota Pertama
            </button>
          </div>
        ) : viewMode === 'tree' ? (
          <TreeView members={members} onNodeClick={handleNodeClick} onEditClick={handleEditClick} currentUserRole={userRole} />
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
