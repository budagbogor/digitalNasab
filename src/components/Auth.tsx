import { useState } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { LogIn, Mail, Lock, UserPlus, AlertCircle, ChevronRight, Loader2, Sparkles, KeyRound } from 'lucide-react';

export default function Auth() {
  const [isEmailLogin, setIsEmailLogin] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const adminEmails = ['mobeng.ho@gmail.com', 'budagbogor@gmail.com'];

  const saveUserToFirestore = async (user: any) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const isDefaultAdmin = adminEmails.includes(user.email || '');
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || displayName || 'User',
        photoURL: user.photoURL || null,
        role: isDefaultAdmin ? 'admin' : 'viewer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await saveUserToFirestore(result.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (result.user) {
          if (displayName) await updateProfile(result.user, { displayName });
          await saveUserToFirestore(result.user);
        }
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        if (result.user) {
          await saveUserToFirestore(result.user);
        }
      }
    } catch (err: any) {
      setError(err.message === 'Firebase: Error (auth/email-already-in-use).' 
        ? 'Email sudah terdaftar. Silakan login.' 
        : err.message === 'Firebase: Error (auth/invalid-credential).' 
        ? 'Email atau password salah.' 
        : err.message);
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
      await sendPasswordResetEmail(auth, email);
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
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-emerald-950">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-800/40 via-transparent to-amber-900/20"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md z-10 animate-in fade-in zoom-in duration-700">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] shadow-2xl p-8 md:p-10 overflow-hidden relative">
          {/* Subtle Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl"></div>
          
          {/* Brand */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Digital Nasab</h1>
            <p className="text-emerald-100/60 text-xs uppercase tracking-[0.3em] font-bold">The Royal Family Vault</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-100 text-sm animate-shake">
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

          {!isEmailLogin ? (
            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full group relative flex items-center justify-center gap-3 bg-white hover:bg-emerald-50 text-gray-900 py-4 px-6 rounded-2xl transition-all font-bold shadow-xl hover:shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-emerald-600" /> : (
                  <>
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                    <span>Lanjutkan dengan Google</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsEmailLogin(true)}
                className="w-full flex items-center justify-center gap-2 text-emerald-300/80 hover:text-white transition-colors py-4 text-sm font-bold"
              >
                <Mail className="w-4 h-4" />
                Atau gunakan Email & Password
              </button>
            </div>
          ) : (
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
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white outline-none focus:border-emerald-500 focus:bg-white/10 transition-all font-medium"
                />
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
                
                <button
                  type="button"
                  onClick={() => setIsEmailLogin(false)}
                  className="text-emerald-500/80 hover:text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em]"
                >
                  Kembali ke Google Login
                </button>
              </div>
            </form>
          )}
        </div>
        
        {/* Footer Tagline */}
        <p className="mt-8 text-center text-emerald-100/30 text-[11px] font-medium tracking-widest uppercase">
          &copy; 2026 Digital Nasab Authority &bull; Arsitektur Silsilah Terpadu
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
