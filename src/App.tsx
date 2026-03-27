import { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from './firebase';
import { FamilyMember, NewFamilyMember } from './types';
import Auth from './components/Auth';
import TreeView from './components/TreeView';
import DirectoryView from './components/DirectoryView';
import MemberModal from './components/MemberModal';
import ProfileModal from './components/ProfileModal';
import Chatbot from './components/Chatbot';
import SeedData from './components/SeedData';
import { LogOut, Plus, Users, Loader2, LayoutGrid, List, Share2 } from 'lucide-react';

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
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tree' | 'directory'>('tree');
  const [appError, setAppError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthReady && user) {
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

      const q = query(collection(db, 'members'), where('ownerId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
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
      return () => unsubscribe();
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
      <header className="bg-emerald-800 text-white shadow-md z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-700 p-2 rounded-lg">
                <Users className="w-6 h-6 text-emerald-100" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Digital Nasab</h1>
                <p className="text-xs text-emerald-200 hidden sm:block">Silsilah Keluarga Digital</p>
              </div>
            </div>
            
            <div className="flex-1 text-center hidden md:block px-4">
              <p className="text-sm font-arabic text-emerald-100 italic" dir="rtl">
                "مَنْ أَحَبَّ أَنْ يُبْسَطَ لَهُ فِي رِزْقِهِ، وَيُنْسَأَ لَهُ فِي أَثَرِهِ، فَلْيَصِلْ رَحِمَهُ"
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center bg-emerald-700 rounded-lg p-1 mr-2">
                <button
                  onClick={() => setViewMode('tree')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'tree' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-200 hover:text-white'}`}
                  title="Tampilan Pohon"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('directory')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'directory' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-200 hover:text-white'}`}
                  title="Tampilan Direktori"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <SeedData userId={user.uid} />
              <button
                onClick={() => { setEditingMember(null); setIsMemberModalOpen(true); }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-emerald-500 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Tambah Anggota</span>
              </button>
              <button
                onClick={() => signOut(auth)}
                className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition-colors"
                title="Keluar"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
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
          />
        ) : (
          <DirectoryView
            members={members}
            onEdit={handleEditClick}
            onDelete={handleDeleteMember}
          />
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
      />

      <Chatbot />
    </div>
  );
}
