import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PiggyLogo } from './PiggyLogo';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { auth } from '../firebase';

interface AuthViewProps {
  onLogin: (name: string, email: string, uid: string, verified: boolean) => void;
}

export function AuthView({ onLogin }: AuthViewProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Authentication mode and method tabs
  const [isStandalone, setIsStandalone] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'google' | 'email'>('google');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // Check if coming back from redirect
    getRedirectResult(auth).then(result => {
      if (result) {
        onLogin(
          result.user.displayName || 'Usuario', 
          result.user.email || '', 
          result.user.uid,
          result.user.emailVerified
        );
      }
    }).catch(err => {
      console.error(err);
      setError(err.message || 'Error al iniciar sesión con Google');
    });
  }, []);

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Detect standalone mode
  useEffect(() => {
    const standaloneiOS = (window.navigator as any).standalone === true;
    const standalonePWA = window.matchMedia('(display-mode: standalone)').matches;
    if (standaloneiOS || standalonePWA) {
      setIsStandalone(true);
      setLoginMethod('email'); // Default to email in standalone mode to bypass popup blocking
    }
  }, []);

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
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user' || err.code === 'auth/unauthorized-domain') {
        try {
          const provider = new GoogleAuthProvider();
          await signInWithRedirect(auth, provider);
        } catch (redirectErr: any) {
           setError('No se pudo usar Google Login (Redirección). Por favor usa Correo.');
           setLoading(false);
        }
      } else {
        setError(err.message || 'Error al iniciar sesión con Google');
        setLoading(false);
      }
    }
    // Note: Do not setLoading(false) in finally here because if redirecting, we want it to stay spinning
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (authMode === 'register') {
        if (!name.trim()) {
          setError('El nombre es obligatorio para registrarse.');
          setLoading(false);
          return;
        }
        // Register new user
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(result.user, { displayName: name.trim() });
        
        onLogin(
          name.trim(),
          result.user.email || '',
          result.user.uid,
          result.user.emailVerified
        );
      } else {
        // Sign in existing user
        const result = await signInWithEmailAndPassword(auth, email.trim(), password);
        onLogin(
          result.user.displayName || 'Usuario',
          result.user.email || '',
          result.user.uid,
          result.user.emailVerified
        );
      }
    } catch (err: any) {
      console.error(err);
      let localizedError = 'Ocurrió un error. Por favor intenta de nuevo.';
      if (err.code === 'auth/user-not-found') localizedError = 'No existe una cuenta con este correo.';
      else if (err.code === 'auth/wrong-password') localizedError = 'Contraseña incorrecta.';
      else if (err.code === 'auth/email-already-in-use') localizedError = 'Este correo ya está registrado.';
      else if (err.code === 'auth/invalid-email') localizedError = 'El formato del correo es inválido.';
      else if (err.code === 'auth/network-request-failed') localizedError = 'Error de conexión de red.';
      
      setError(localizedError);
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

        {isStandalone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl text-xs font-semibold text-center leading-relaxed"
          >
            💡 <strong className="text-amber-900">Nota para iOS / Safari al Inicio:</strong> Apple bloquea la ventana de acceso de Google en este modo. Te recomendamos registrate o ingresar utilizando <strong>Correo Electrónico</strong> para funcionar perfectamente.
          </motion.div>
        )}

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', bounce: 0.4 }}
          className="bg-white border text-center border-slate-200 rounded-3xl p-6 shadow-xl relative overflow-hidden"
        >
          <div className="flex flex-col gap-4 relative text-left z-10">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight text-center">
              {authMode === 'login' ? 'Accede a tu cuenta' : 'Crea tu cuenta'}
            </h2>

            {/* Toggle Login Method */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-1">
              <button
                type="button"
                onClick={() => setLoginMethod('google')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  loginMethod === 'google' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-4 h-4" />
                Google
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  loginMethod === 'email' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-600">mail</span>
                Correo
              </button>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold text-center border border-red-100 leading-relaxed">
                {error}
              </div>
            )}

            {loginMethod === 'google' ? (
              <div className="text-center py-4">
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
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  {loading ? 'Conectando...' : 'Entrar con Google'}
                </motion.button>
              </div>
            ) : (
              <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
                {authMode === 'register' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nombre</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Camila Porras"
                      className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-emerald-500 font-bold placeholder-slate-400"
                      required
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-emerald-500 font-bold placeholder-slate-400"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contraseña</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-emerald-500 font-bold placeholder-slate-400"
                    required
                  />
                </div>

                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white font-bold py-3 rounded-2xl shadow-sm text-xs hover:bg-emerald-700 transition-all mt-2 flex items-center justify-center disabled:opacity-75"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                  ) : authMode === 'login' ? (
                    'Iniciar Sesión'
                  ) : (
                    'Registrarme'
                  )}
                </motion.button>

                <div className="text-center mt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'register' : 'login');
                      setError(null);
                    }}
                    className="text-emerald-600 hover:text-emerald-700 font-bold text-xs"
                  >
                    {authMode === 'login' ? '¿No tienes cuenta? Registrate' : '¿Ya tienes cuenta? Inicia sesión'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
