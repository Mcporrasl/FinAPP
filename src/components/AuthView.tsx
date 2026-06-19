import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PiggyLogo } from './PiggyLogo';
import { 
  signInWithPopup, 
  signInWithRedirect,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase';

interface AuthViewProps {
  onLogin: (name: string, email: string, uid: string, verified: boolean) => void;
}

export function AuthView({ onLogin }: AuthViewProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect standalone mode (iOS Home Screen or PWA)
    const standaloneiOS = (window.navigator as any).standalone === true;
    const standalonePWA = window.matchMedia('(display-mode: standalone)').matches;
    if (standaloneiOS || standalonePWA) {
      setIsStandalone(true);
    }
  }, []);

  const handleGoogleLogin = () => {
    // Importante: No llamar a setLoading(true) aquí porque rompe el contexto síncrono del evento click
    // y causa que Safari en iOS PWA bloquee el popup.
    setError(null);
    const provider = new GoogleAuthProvider();
    
    // En iOS PWA, esto abrirá un SFSafariViewController superpuesto que comparte la sesión
    // y no rompe la caja de arena de la PWA (a diferencia de signInWithRedirect).
    signInWithPopup(auth, provider)
      .then((result) => {
        setLoading(true);
        onLogin(
          result.user.displayName || 'Usuario', 
          result.user.email || '', 
          result.user.uid,
          result.user.emailVerified
        );
      })
      .catch((err) => {
        console.error("Login error:", err);
        setLoading(false);
        if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
           setError('El navegador bloqueó la ventana. Por favor, inténtalo de nuevo y permite la ventana emergente.');
        } else {
           setError(err.message || 'Error al iniciar sesión con Google');
        }
      });
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

        {isStandalone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs font-semibold text-center leading-relaxed"
          >
            💡 <strong className="text-emerald-900">Modo App:</strong> Se iniciará sesión de forma segura a través de una redirección.
          </motion.div>
        )}

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', bounce: 0.4 }}
          className="bg-white border text-center border-slate-200 rounded-3xl p-6 shadow-xl relative overflow-hidden"
        >
          <div className="flex flex-col gap-4 relative text-left z-10">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight text-center mb-2">
              Accede a tu cuenta
            </h2>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold text-center border border-red-100 leading-relaxed">
                {error}
              </div>
            )}

            <div className="text-center py-2">
              <p className="text-slate-500 font-medium text-xs mb-4 leading-relaxed">
                Conéctate directamente con tu cuenta de Google. Tu perfil e información de bienestar se cargarán al instante.
              </p>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-black py-3.5 rounded-2xl shadow-sm transition-all text-sm flex items-center justify-center gap-3 disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent animate-spin rounded-full"></div>
                ) : (
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                )}
                {loading ? 'Conectando...' : 'Entrar con Google'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
