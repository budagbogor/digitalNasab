import { useState } from 'react';
import { supabase } from '../supabase';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Login failed:", error);
      setErrorMsg("Gagal masuk dengan Google. Pastikan 'Google Provider' sudah diaktifkan di Dashboard Supabase Anda.");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }

      if (result.error) throw result.error;
    } catch (error: any) {
      console.error("Auth error:", error);
      setErrorMsg(error.message || "Terjadi kesalahan saat autentikasi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-emerald-100">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-emerald-900 mb-1">Digital Nasab</h1>
        <p className="text-emerald-600 mb-8 text-sm">Silsilah Keluarga Digital</p>
        
        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg text-left">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {isSignUp ? 'Daftar Sekarang' : 'Masuk'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Atau</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 px-6 rounded-xl transition-all font-bold text-sm shadow-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
          Masuk dengan Google
        </button>

        <p className="mt-8 text-xs text-gray-500">
          {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun?'}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="ml-1 text-emerald-600 font-bold hover:underline"
          >
            {isSignUp ? 'Masuk di sini' : 'Daftar di sini'}
          </button>
        </p>
      </div>
    </div>
  );
}
