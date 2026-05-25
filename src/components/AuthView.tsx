import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PiggyLogo } from './PiggyLogo';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthViewProps {
  onLogin: (name: string, email: string, uid: string, verified: boolean) => void;
}

export function AuthView({ onLogin }: AuthViewProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      onLogin(
        result.user.displayName || 'Usuario', 
        result.user.email || '', 
        result.user.uid,
        result.user.emailVerified
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-emerald-100">
      <div className="w-full max-w-sm relative z-10">
        
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.6 }}
          className="text-center mb-8 flex flex-col items-center"
        >
          <div className="bg-white p-4 rounded-full shadow-lg shadow-slate-200 mb-4 border-4 border-white">
             <PiggyLogo size={100} />
          </div>
          <h1 className="font-sans text-4xl font-black tracking-tighter text-slate-900 mb-2">
            Fin<span className="text-emerald-500">APP</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm bg-white border border-slate-200 px-4 py-1.5 rounded-full shadow-sm inline-block">Tu bienestar financiero, a tu ritmo.</p>
        </motion.div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', bounce: 0.4 }}
          className="bg-white border text-center border-slate-200 rounded-3xl p-8 shadow-xl relative overflow-hidden"
        >
          <div className="flex flex-col gap-5 relative text-left z-10">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight text-center">
              Accede a tu cuenta
            </h2>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold text-center border border-red-100">
                {error}
              </div>
            )}

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-black py-4 rounded-2xl shadow-sm transition-all mt-4 text-base flex items-center justify-center gap-3 disabled:opacity-70"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
              {loading ? 'Conectando...' : 'Entrar con Google'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
