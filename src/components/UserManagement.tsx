import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { AppUser, UserRole } from '../types';
import { Shield, User, Loader2, Search, UserPlus, X, Key, Mail, ShieldAlert } from 'lucide-react';

const adminEmails = ['mobeng.ho@gmail.com', 'budagbogor@gmail.com'];

export default function UserManagement({ currentUserRole }: { currentUserRole: UserRole }) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('viewer');
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data as any[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();

    const client = getSupabaseClient();
    const channel = client
      .channel('users_changes')
      .on('postgres_changes' as any, { event: '*', table: 'users' }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const client = getSupabaseClient();
      
      // 1. Sign up user di Supabase Auth
      const { data, error: signUpError } = await client.auth.signUp({
        email: newEmail,
        password: newPassword,
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        const isDefaultAdmin = adminEmails.includes(newEmail.toLowerCase()) || newRole === 'admin';
        
        // 2. Masukkan ke tabel users kita agar langsung muncul di list
        const { error: insertError } = await client.from('users').insert({
          uid: data.user.id,
          email: newEmail.toLowerCase(),
          displayName: newEmail.split('@')[0],
          role: isDefaultAdmin ? 'admin' : 'viewer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        if (insertError) throw insertError;

        alert('Pengguna berhasil dibuat! Email konfirmasi (jika aktif) telah dikirim.');
        setShowAddForm(false);
        setNewEmail('');
        setNewPassword('');
        setNewRole('viewer');
        fetchUsers();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from('users')
        .update({ role: newRole, updatedAt: new Date().toISOString() })
        .eq('uid', userId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Gagal memperbarui role. Pastikan Anda memiliki izin admin.');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (currentUserRole !== 'admin') {
    return (
      <div className="p-8 text-center bg-white h-full flex flex-col items-center justify-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-black text-gray-900 mb-2">Akses Ditolak</h2>
        <p className="text-gray-500 max-w-sm">Hanya Admin yang memiliki otorisasi untuk mengelola pengguna aplikasi ini.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50/50">
      <div className="max-w-5xl mx-auto p-6 md:p-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-600" />
              Manajemen Pengguna
            </h2>
            <p className="text-gray-500 mt-1 font-medium italic">Kelola otoritas akses keluarga besar iman diharjo.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari email/nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
              />
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl text-sm font-black transition-all shadow-lg shadow-emerald-200 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">User Baru</span>
            </button>
          </div>
        </div>

        {/* Add User Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-emerald-100 animate-in zoom-in-95 duration-300">
              <div className="p-8 bg-emerald-50/50 border-b border-emerald-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-gray-900">Buat Akun Baru</h3>
                <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreateUser} className="p-8 space-y-5">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Email Pengguna</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                      placeholder="contoh@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Password Sementara</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                      placeholder="Min. 6 karakter"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Role Jabatan</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewRole('viewer')}
                      className={`py-3 rounded-2xl font-bold text-sm transition-all border-2 ${
                        newRole === 'viewer' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-gray-50 border-transparent text-gray-500 grayscale'
                      }`}
                    >
                      Viewer
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRole('admin')}
                      className={`py-3 rounded-2xl font-bold text-sm transition-all border-2 ${
                        newRole === 'admin' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-gray-50 border-transparent text-gray-500 grayscale'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full bg-emerald-700 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-100 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
                >
                  {isCreating ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Buat Akun'}
                </button>
              </form>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
            <p className="text-emerald-800 font-bold animate-pulse">Menghubungkan ke Pusat Data...</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-900 text-white">
                    <th className="px-8 py-5 text-sm font-black uppercase tracking-widest">Identitas Pengguna</th>
                    <th className="px-8 py-5 text-sm font-black uppercase tracking-widest">Otoritas</th>
                    <th className="px-8 py-5 text-sm font-black uppercase tracking-widest text-right">Manajemen Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-emerald-50/30 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700 font-black shadow-inner overflow-hidden border-2 border-white ring-1 ring-emerald-50">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <div className="text-lg font-black text-gray-900 group-hover:text-emerald-600 transition-colors">{user.displayName || 'Tanpa Nama'}</div>
                            <div className="text-sm font-medium text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm ${
                          user.role === 'admin' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {user.role === 'admin' ? 'Administrator' : 'Pengunjung (Viewer)'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {user.email === 'budagbogor@gmail.com' ? (
                          <span className="text-xs font-bold text-emerald-600 italic">Akun Utama (Superadmin)</span>
                        ) : (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {user.role === 'viewer' ? (
                              <button
                                onClick={() => handleUpdateRole(user.uid, 'admin')}
                                className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
                              >
                                Beri Akses Admin
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateRole(user.uid, 'viewer')}
                                className="px-4 py-2 bg-red-50 text-red-700 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white transition-all active:scale-95"
                              >
                                Turunkan ke Viewer
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="px-8 py-20 text-center flex flex-col items-center">
                <Search className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold italic text-lg">Tidak ada data pengguna yang cocok.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
