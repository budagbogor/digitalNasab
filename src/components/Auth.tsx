import { useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { Mail, Lock, UserPlus, AlertCircle, ChevronRight, Loader2, Sparkles, KeyRound, Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const adminEmails = ['mobeng.ho@gmail.com', 'budagbogor@gmail.com'];

  const saveUserToSupabase = async (user: any) => {
    const client = getSupabaseClient();
    const userEmail = user.email?.toLowerCase() || '';
    const isDefaultAdmin = adminEmails.includes(userEmail);
    
    const { data: existingUser } = await client
      .from('users')
      .select('*')
      .eq('uid', user.id)
      .single();

    if (!existingUser) {
      await client.from('users').insert({
        uid: user.id,
        email: userEmail,
        displayName: user.user_metadata?.full_name || displayName || 'User',
        photoURL: user.user_metadata?.avatar_url || null,
        role: isDefaultAdmin ? 'admin' : 'viewer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else if (isDefaultAdmin && existingUser.role !== 'admin') {
      await client
        .from('users')
        .update({ role: 'admin', updatedAt: new Date().toISOString() })
        .eq('uid', user.id);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const client = getSupabaseClient();
      if (isRegister) {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: displayName
            }
          }
        });
        if (error) throw error;
        if (data.user) await saveUserToSupabase(data.user);
        alert('Cek email Anda untuk konfirmasi pendaftaran.');
      } else {
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) await saveUserToSupabase(data.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Masukkan email Anda untuk reset password.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-emerald-950">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-800/40 via-transparent to-amber-900/20"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative w-full max-w-md z-10 animate-in fade-in zoom-in duration-700">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] shadow-2xl p-8 md:p-10 overflow-hidden relative">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl"></div>
          
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Digital Nasab</h1>
            <p className="text-emerald-300 font-bold tracking-[0.3em] text-[10px] uppercase">Keluarga Besar Iman Diharjo</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-100 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {resetSent && (
            <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-100 text-sm">
              <KeyRound className="w-5 h-5 flex-shrink-0" />
              <p>Email reset password telah dikirim ke Inbox Anda.</p>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegister && (
              <div className="relative group">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-100/40 group-focus-within:text-emerald-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white outline-none focus:border-emerald-500 focus:bg-white/10 transition-all font-medium"
                />
              </div>
            )}
            
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-100/40 group-focus-within:text-emerald-400 transition-colors" />
              <input
                type="email"
                placeholder="Email Anda"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white outline-none focus:border-emerald-500 focus:bg-white/10 transition-all font-medium"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-100/40 group-focus-within:text-emerald-400 transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white outline-none focus:border-emerald-500 focus:bg-white/10 transition-all font-medium"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-100/40 hover:text-white transition-colors p-1"
                title={showPassword ? "Sembunyikan Password" : "Lihat Password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {!isRegister && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-emerald-300/60 hover:text-emerald-400 text-[10px] font-bold uppercase tracking-widest"
                >
                  Lupa Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 py-4 rounded-2xl font-black text-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Daftar Sekarang' : 'Masuk Dashboard'}</span>
                  <ChevronRight className="w-6 h-6" />
                </>
              )}
            </button>

            <div className="pt-6 flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-emerald-100/60 hover:text-white text-sm font-bold"
              >
                {isRegister ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-8 text-center text-emerald-100/30 text-[11px] font-medium tracking-widest uppercase">
          &copy; 2026 Digital Nasab Authority &bull; Powered by Supabase
        </p>
      </div>
    </div>
  );
}
