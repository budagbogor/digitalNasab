import { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, setDoc, getDoc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from './firebase';
import { FamilyMember, NewFamilyMember, UserRole, AppUser } from './types';
import Auth from './components/Auth';
import TreeView from './components/TreeView';
import DirectoryView from './components/DirectoryView';
import UserManagement from './components/UserManagement';
import MemberModal from './components/MemberModal';
import ProfileModal from './components/ProfileModal';
import Chatbot from './components/Chatbot';
import ExcelImport from './components/ExcelImport';
import StatsView from './components/StatsView';
import { LogOut, Plus, Users, Loader2, LayoutGrid, List, Share2, ShieldCheck, BarChart2 } from 'lucide-react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: any[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function ErrorFallback({ error }: { error: Error }) {
  let displayMessage = "Terjadi kesalahan yang tidak terduga.";
  try {
    const errInfo = JSON.parse(error.message) as FirestoreErrorInfo;
    if (errInfo.error.includes('insufficient permissions')) {
      displayMessage = `Izin ditolak untuk operasi ${errInfo.operationType} pada ${errInfo.path}. Silakan periksa aturan keamanan Anda.`;
    } else {
      displayMessage = errInfo.error;
    }
  } catch (e) {
    displayMessage = error.message;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Share2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Ada Masalah</h2>
        <p className="text-gray-600 mb-6">{displayMessage}</p>
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
  const [viewMode, setViewMode] = useState<'tree' | 'directory' | 'users' | 'stats'>('tree');
  const [appError, setAppError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user role
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserRole(userSnap.data().role as UserRole);
        } else {
          // Default role if doc doesn't exist yet
          setUserRole(currentUser.email === 'mobeng.ho@gmail.com' ? 'admin' : 'viewer');
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthReady && user) {
      // Listen for role changes in real-time
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeRole = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          setUserRole(doc.data().role as UserRole);
        }
      });

      // Test connection to Firestore
      const testConnection = async () => {
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (error) {
          if (error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration.");
          }
        }
      };
      testConnection();

      const q = query(collection(db, 'members')); // Admins and viewers can see all members in a shared tree
      const unsubscribeMembers = onSnapshot(q, (snapshot) => {
        const membersData: FamilyMember[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          membersData.push({
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as FamilyMember);
        });
        setMembers(membersData);
        setIsLoading(false);
      }, (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'members');
        } catch (e) {
          setAppError(e as Error);
        }
        setIsLoading(false);
      });
      return () => {
        unsubscribeRole();
        unsubscribeMembers();
      };
    } else if (isAuthReady && !user) {
      setMembers([]);
      setIsLoading(false);
    }
  }, [user, isAuthReady]);

  const handleSaveMember = async (memberData: NewFamilyMember | FamilyMember) => {
    if (!user) return;
    
    const path = 'members';
    const dataToSave = {
      ...memberData,
      fullName: memberData.fullName.toUpperCase(),
    };

    try {
      let memberId = '';
      if ('id' in memberData && memberData.id) {
        // Update
        memberId = memberData.id;
        const docRef = doc(db, path, memberId);
        await updateDoc(docRef, {
          ...dataToSave,
          updatedAt: new Date(),
        });
      } else {
        // Create
        const membersRef = collection(db, path);
        const newDocRef = doc(membersRef);
        memberId = newDocRef.id;
        await setDoc(newDocRef, {
          ...dataToSave,
          id: memberId,
          ownerId: user.uid,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Handle Bidirectional Spouse Relationship
      if (dataToSave.spouseId) {
        const spouseRef = doc(db, path, dataToSave.spouseId);
        await updateDoc(spouseRef, {
          spouseId: memberId,
          updatedAt: new Date(),
        });
      } else {
        // If spouse was removed, clear it from the previous spouse
        const previousSpouse = members.find(m => m.spouseId === memberId && m.id !== dataToSave.spouseId);
        if (previousSpouse) {
          const prevSpouseRef = doc(db, path, previousSpouse.id);
          await updateDoc(prevSpouseRef, {
            spouseId: null,
            updatedAt: new Date(),
          });
        }
      }

      setIsMemberModalOpen(false);
      setEditingMember(null);
    } catch (error) {
      try {
        handleFirestoreError(error, ('id' in memberData ? OperationType.UPDATE : OperationType.CREATE), path);
      } catch (e) {
        setAppError(e as Error);
      }
    }
  };

  const handleEditClick = (member: FamilyMember) => {
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  const handleDeleteMember = async (memberId: string) => {
    const path = `members/${memberId}`;
    try {
      // Clear references in other members before deleting
      const updates = members.map(async (m) => {
        const mRef = doc(db, 'members', m.id);
        if (m.parentId === memberId) await updateDoc(mRef, { parentId: null });
        if (m.motherId === memberId) await updateDoc(mRef, { motherId: null });
        if (m.spouseId === memberId) await updateDoc(mRef, { spouseId: null });
      });
      await Promise.all(updates);

      await deleteDoc(doc(db, 'members', memberId));
      setIsProfileModalOpen(false);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, path);
      } catch (e) {
        setAppError(e as Error);
      }
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

  if (appError) {
    return <ErrorFallback error={appError} />;
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
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end">
              <div className="hidden lg:block mr-2">
                <ExcelImport userId={user.uid} currentUserRole={userRole} />
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
                onClick={() => signOut(auth)}
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
          <ExcelImport userId={user.uid} currentUserRole={userRole} />
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

      <Chatbot members={members} />
    </div>
  );
}
