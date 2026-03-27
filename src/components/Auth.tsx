import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { LogIn } from 'lucide-react';

export default function Auth() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-emerald-100">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-emerald-900 mb-2">Digital Nasab</h1>
        <p className="text-emerald-600 mb-8">Silsilah Keluarga Digital</p>
        
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-emerald-700 hover:bg-emerald-800 text-white py-3 px-6 rounded-xl transition-colors font-medium"
        >
          <LogIn className="w-5 h-5" />
          Masuk dengan Google
        </button>
      </div>
    </div>
  );
}
