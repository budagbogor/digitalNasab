import { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabase';
import { FamilyMember, NewFamilyMember, UserRole, AppUser, GlobalSettings } from './types';
import Auth from './components/Auth';
import TreeView from './components/TreeView';
import DirectoryView from './components/DirectoryView';
import UserManagement from './components/UserManagement';
import SettingsView from './components/SettingsView';
import MemberModal from './components/MemberModal';
import ProfileModal from './components/ProfileModal';
import Chatbot from './components/Chatbot';
import ExcelImport from './components/ExcelImport';
import StatsView from './components/StatsView';
import { LogOut, Plus, Users, Loader2, LayoutGrid, List, Share2, ShieldCheck, BarChart2, Settings } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>('viewer');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tree' | 'directory' | 'users' | 'stats' | 'settings'>('tree');
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);

  const isSupabaseConfigured = useMemo(() => {
    const url = import.meta.env.VITE_SUPABASE_URL || 'https://lzabftyyltzqadhnuwwk.supabase.co';
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6YWJmdHl5bHR6cWFkaG51d3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MjM5MDksImV4cCI6MjA4OTk5OTkwOX0.wniv-nb6EKicN74e52Vx5Z8Je7HdVXLtU2tpjTgmN9o';
    if (!url || !key) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsAuthReady(true);
      setIsLoading(false);
      return;
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setIsAuthReady(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserRole(currentUser.id);
      } else {
        setUserRole('viewer');
      }
      setIsAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, [isSupabaseConfigured]);

  const fetchUserRole = async (uid: string) => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('uid', uid)
      .single();
    
    if (data && !error) {
      setUserRole(data.role as UserRole);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (isAuthReady && user) {
      fetchMembers();
      fetchGlobalSettings();

      // Subscribe to real-time changes
      const membersChannel = supabase
        .channel('members_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
          fetchMembers();
        })
        .subscribe();

      const settingsChannel = supabase
        .channel('settings_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
          fetchGlobalSettings();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(membersChannel);
        supabase.removeChannel(settingsChannel);
      };
    } else if (isAuthReady && !user) {
      setMembers([]);
      setGlobalSettings(null);
      setIsLoading(false);
    }
  }, [user, isAuthReady, isSupabaseConfigured]);

  const fetchGlobalSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();
      
      if (data && !error) {
        setGlobalSettings({
          id: data.id,
          aiProvider: data.ai_provider,
          sumopodApiKey: data.sumopod_api_key,
          updatedAt: data.updated_at
        });
      }
    } catch (error) {
      console.error('Error fetching global settings:', error);
    }
  };

  const fetchMembers = async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
    } else if (data) {
      const mappedMembers: FamilyMember[] = data.map(m => ({
        id: m.id,
        ownerId: m.owner_id,
        fullName: m.full_name,
        gender: m.gender,
        isAlive: m.is_alive,
        birthDate: m.birth_date,
        deathDate: m.death_date,
        address: m.address,
        parentId: m.parent_id,
        motherId: m.mother_id,
        spouseId: m.spouse_id,
        photoUrl: m.photo_url,
        phone: m.phone,
        occupation: m.occupation,
        education: m.education,
        bio: m.bio,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      }));
      setMembers(mappedMembers);
    }
    setIsLoading(false);
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-emerald-100">
          <ShieldCheck className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Konfigurasi Diperlukan</h1>
          <p className="text-gray-600 mb-6">
            Silakan atur variabel lingkungan <strong>VITE_SUPABASE_URL</strong> dan <strong>VITE_SUPABASE_ANON_KEY</strong> di menu Settings untuk menghubungkan aplikasi ke database Supabase Anda.
          </p>
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm text-amber-800 text-left">
            <p className="font-semibold mb-1">Langkah-langkah:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Buka Supabase Dashboard</li>
              <li>Pilih Project Settings &gt; API</li>
              <li>Salin Project URL dan anon public key</li>
              <li>Tempel ke Settings di AI Studio</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveMember = async (memberData: NewFamilyMember | FamilyMember) => {
    if (!user) return;
    
    const dataToSave = {
      full_name: memberData.fullName.toUpperCase(),
      gender: memberData.gender,
      is_alive: memberData.isAlive,
      birth_date: memberData.birthDate || null,
      death_date: memberData.deathDate || null,
      address: memberData.address || null,
      parent_id: memberData.parentId || null,
      mother_id: memberData.motherId || null,
      spouse_id: memberData.spouseId || null,
      photo_url: memberData.photoUrl || null,
      phone: memberData.phone || null,
      occupation: memberData.occupation || null,
      education: memberData.education || null,
      bio: memberData.bio || null,
      updated_at: new Date().toISOString(),
    };

    try {
      let memberId = '';
      if ('id' in memberData && memberData.id) {
        // Update
        memberId = memberData.id;
        const { error } = await supabase
          .from('members')
          .update(dataToSave)
          .eq('id', memberId);
        if (error) throw error;
      } else {
        // Create
        const { data, error } = await supabase
          .from('members')
          .insert([{
            ...dataToSave,
            owner_id: user.id,
            created_at: new Date().toISOString(),
          }])
          .select()
          .single();
        if (error) throw error;
        memberId = data.id;
      }

      // Handle Bidirectional Spouse Relationship
      if (memberData.spouseId) {
        await supabase
          .from('members')
          .update({ spouse_id: memberId, updated_at: new Date().toISOString() })
          .eq('id', memberData.spouseId);
      } else {
        // If spouse was removed, clear it from the previous spouse
        const previousSpouse = members.find(m => m.spouseId === memberId && m.id !== memberData.spouseId);
        if (previousSpouse) {
          await supabase
            .from('members')
            .update({ spouse_id: null, updated_at: new Date().toISOString() })
            .eq('id', previousSpouse.id);
        }
      }

      setIsMemberModalOpen(false);
      setEditingMember(null);
    } catch (error) {
      console.error('Error saving member:', error);
      alert('Gagal menyimpan data anggota.');
    }
  };

  const handleEditClick = (member: FamilyMember) => {
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      // Clear references in other members before deleting (Supabase FKs might handle this if ON DELETE SET NULL is set, but let's be explicit)
      await supabase
        .from('members')
        .update({ parent_id: null })
        .eq('parent_id', memberId);
      
      await supabase
        .from('members')
        .update({ mother_id: null })
        .eq('mother_id', memberId);

      await supabase
        .from('members')
        .update({ spouse_id: null })
        .eq('spouse_id', memberId);

      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
      setIsProfileModalOpen(false);
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Gagal menghapus data anggota.');
    }
  };

  const handleNodeClick = (member: FamilyMember) => {
    setSelectedMember(member);
    setIsProfileModalOpen(true);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-emerald-800 text-white shadow-lg z-20 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center py-3 md:h-20 gap-4 md:gap-0">
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="bg-emerald-700 p-2.5 rounded-xl shadow-inner">
                <Users className="w-6 h-6 text-emerald-100" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight leading-none">Digital Nasab</h1>
                <p className="text-[10px] text-emerald-300 mt-1 uppercase tracking-widest font-semibold hidden sm:block">Silsilah Keluarga Digital</p>
              </div>
            </div>
            
            {/* Center: Navigation Toggles */}
            <div className="flex items-center bg-emerald-900/50 backdrop-blur-sm rounded-xl p-1 border border-emerald-700/50 shadow-inner">
              <button
                onClick={() => setViewMode('tree')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  viewMode === 'tree' 
                    ? 'bg-emerald-600 text-white shadow-md scale-105' 
                    : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Pohon</span>
              </button>
              <button
                onClick={() => setViewMode('directory')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  viewMode === 'directory' 
                    ? 'bg-emerald-600 text-white shadow-md scale-105' 
                    : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Direktori</span>
              </button>
              <button
                onClick={() => setViewMode('stats')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  viewMode === 'stats' 
                    ? 'bg-emerald-600 text-white shadow-md scale-105' 
                    : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span className="hidden sm:inline">Statistik</span>
              </button>
              {userRole === 'admin' && (
                <>
                  <button
                    onClick={() => setViewMode('users')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                      viewMode === 'users' 
                        ? 'bg-emerald-600 text-white shadow-md scale-105' 
                        : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">User</span>
                  </button>
                  <button
                    onClick={() => setViewMode('settings')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                      viewMode === 'settings' 
                        ? 'bg-emerald-600 text-white shadow-md scale-105' 
                        : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </button>
                </>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end">
              <div className="hidden lg:block mr-2">
                <ExcelImport userId={user.id} currentUserRole={userRole} />
              </div>
              
              {userRole === 'admin' && (
                <button
                  onClick={() => { setEditingMember(null); setIsMemberModalOpen(true); }}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-amber-950 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95 border border-amber-400/50"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden xl:inline">Tambah Anggota</span>
                </button>
              )}

              <div className="h-8 w-px bg-emerald-700/50 mx-1 hidden md:block"></div>

              <button
                onClick={() => supabase.auth.signOut()}
                className="p-2.5 text-emerald-200 hover:text-white hover:bg-red-500/20 rounded-xl transition-all group"
                title="Keluar"
              >
                <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Excel Import (Visible only on mobile/tablet) */}
        <div className="lg:hidden bg-emerald-900/30 border-t border-emerald-700/30 px-4 py-2 flex justify-center">
          <ExcelImport userId={user.id} currentUserRole={userRole} />
        </div>

        {/* Hadith Banner (Desktop only, subtle) */}
        <div className="hidden xl:block bg-emerald-900/40 py-1.5 border-t border-emerald-700/30">
          <p className="text-[11px] text-center font-arabic text-emerald-200/80 italic tracking-wide" dir="rtl">
            "مَنْ أَحَبَّ أَنْ يُبْسَطَ لَهُ فِي رِزْقِهِ، وَيُنْسَأَ لَهُ فِي أَثَرِهِ، فَلْيَصِلْ رَحِمَهُ"
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {isLoading ? (
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
              Mulai bangun silsilah keluarga Anda dengan menambahkan anggota pertama. Anda bisa menambahkan orang tua, anak, atau pasangan nantinya.
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
            currentUserRole={userRole}
          />
        ) : viewMode === 'stats' ? (
          <StatsView members={members} />
        ) : viewMode === 'settings' ? (
          <SettingsView currentUserRole={userRole} />
        ) : (
          <UserManagement currentUserRole={userRole} />
        )}
      </main>

      {/* Modals & Chatbot */}
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

      <Chatbot members={members} globalSettings={globalSettings} />
    </div>
  );
}
