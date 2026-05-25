import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { doc, updateDoc, getDoc, setDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { SubscriptionTier } from '../types';

interface SubscriptionTabProps {
  currentTier: SubscriptionTier;
  userId: string;
  onUpgrade: (tier: SubscriptionTier) => void;
}

export function SubscriptionTab({ currentTier, userId, onUpgrade }: SubscriptionTabProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [showWompiMissingModal, setShowWompiMissingModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [liveWompiPublicKey, setLiveWompiPublicKey] = useState<string | null>(null);

  // Precios en COP (Simulados para Wompi, en centavos y en formato de vista)
  const plans = {
    pro_monthly: { label: 'Mensual', priceCOP: 19900, cents: 1990000, desc: 'Manejo de finanzas con 1 familiar extra.' },
    pro_annual: { label: 'Anual', priceCOP: 145900, cents: 14590000, desc: 'Ahorra un 15% pagando el año completo.' },
    pro_lifetime: { label: 'Vitalicia', priceCOP: 259900, cents: 25990000, desc: 'Paga una sola vez y disfruta de FinAPP Pro para siempre.' },
  };

  useEffect(() => {
    // Obtener la llave pública real de Wompi de manera dinámica desde el servidor
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const config = await res.json();
          if (config.wompiPublicKey) {
            setLiveWompiPublicKey(config.wompiPublicKey);
          }
        }
      } catch (err) {
        console.error("Error al obtener la llave pública del servidor:", err);
      }
    };
    fetchConfig();

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const env = params.get('env');
    
    if (id) {
       verifyWompiTransaction(id, env || 'prod');
    }
  }, []);

  const verifyWompiTransaction = async (txId: string, env: string) => {
    setLoading('verifying');
    try {
       const publicKey = liveWompiPublicKey || import.meta.env.VITE_WOMPI_PUBLIC_KEY || "pub_prod_Y2FkIPaXDNlWN4lxJzL8mh45ySxNMYT9";
       const isProd = publicKey ? publicKey.startsWith('pub_prod_') : (env !== 'test');
       const url = isProd ? `https://api.wompi.co/v1/transactions/${txId}` : `https://sandbox.wompi.co/v1/transactions/${txId}`;
       const res = await fetch(url);
       if (res.ok) {
          const data = await res.json();
          const tx = data.data;
          
          if (tx.status === 'APPROVED') {
             const parts = tx.reference.split('-');
             if (parts.length >= 4 && parts[0] === 'FINAPP') {
                const tier = parts[1] as SubscriptionTier; 
                
                const userRef = doc(db, 'users', userId);
                const updates: any = { subscriptionTier: tier };
                if (tier === 'pro_monthly' || tier === 'pro_annual') {
                   const expiration = new Date();
                   expiration.setDate(expiration.getDate() + (tier === 'pro_monthly' ? 30 : 365));
                   updates.subscriptionExpiresAt = expiration.toISOString();
                } else {
                   updates.subscriptionExpiresAt = null;
                }
                
                await setDoc(userRef, updates, { merge: true });
                onUpgrade(tier);
                alert('¡Pago Exitoso con Wompi! Disfruta de FinAPP Pro.');
             }
          } else {
             alert(`El pago está en estado: ${tx.status}`);
          }
       }
    } catch (e) {
       console.error("Error verificando tx wompi:", e);
    } finally {
       setLoading(null);
       window.history.replaceState({}, '', '/?tab=subscription');
    }
  };

  const handleWompiCheckout = async (tier: SubscriptionTier) => {
    const publicKey = liveWompiPublicKey || import.meta.env.VITE_WOMPI_PUBLIC_KEY || "pub_prod_Y2FkIPaXDNlWN4lxJzL8mh45ySxNMYT9";
    
    setLoading(tier);

    // Integración real Web Checkout Wompi
    const reference = `FINAPP-${tier}-${userId}-${Date.now()}`;
    const amountInCents = plans[tier as keyof typeof plans].cents;
    const redirectUrl = window.location.origin + window.location.pathname + '?tab=subscription';
    
    // Obtener firma de integridad en producción de forma dinámica
    let signature = '';
    try {
      const sigRes = await fetch('/api/wompi/signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reference, amountInCents, currency: 'COP' })
      });
      if (sigRes.ok) {
        const sigData = await sigRes.json();
        if (sigData.signature) {
          signature = sigData.signature;
        }
      }
    } catch (err) {
      console.error("Error al firmar transacción con Wompi:", err);
    }

    const isProd = publicKey.startsWith('pub_prod_');
    const checkoutBase = isProd ? 'https://checkout.wompi.co/p/' : 'https://checkout.sandbox.wompi.co/p/';
    
    let checkoutUrl = `${checkoutBase}?public-key=${publicKey}&currency=COP&amount-in-cents=${amountInCents}&reference=${reference}&redirect-url=${encodeURIComponent(redirectUrl)}`;
    
    if (signature) {
      checkoutUrl += `&signature:integrity=${signature}`;
    }

    window.location.href = checkoutUrl;
  };

  const handleDemoBypassActivate = async () => {
    if (!selectedTier) return;
    setLoading('demo-bypass');
    try {
      const userRef = doc(db, 'users', userId);
      const updates: any = { subscriptionTier: selectedTier };
      
      if (selectedTier === 'pro_monthly' || selectedTier === 'pro_annual') {
         const expiration = new Date();
         expiration.setDate(expiration.getDate() + (selectedTier === 'pro_monthly' ? 30 : 365));
         updates.subscriptionExpiresAt = expiration.toISOString();
      } else {
         updates.subscriptionExpiresAt = null;
      }
      
      await setDoc(userRef, updates, { merge: true });
      onUpgrade(selectedTier);
      setShowWompiMissingModal(false);
    } catch(e) {
      console.error("Error al simular la suscripción:", e);
      alert('Error al simular la suscripción.');
    } finally {
      setLoading(null);
    }
  };

  const handleRedeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    
    setLoading('coupon');
    setCouponError('');
    const code = couponCode.toUpperCase().trim();
    
    try {
      const isSuccess = await runTransaction(db, async (transaction) => {
        const couponRef = doc(db, 'coupons', code);
        const couponDoc = await transaction.get(couponRef);
        
        // Let's seed the coupons if they don't exist for demo purposes
        if (!couponDoc.exists()) {
          if (code === 'EMPMANUELITA') {
            transaction.set(couponRef, { maxUses: 30, currentUses: 1, tier: 'pro_monthly' });
          } else if (code === 'PREMMC04') {
            transaction.set(couponRef, { maxUses: 50, currentUses: 1, tier: 'pro_lifetime' });
          } else if (code === 'DEMO') {
            transaction.set(couponRef, { maxUses: 1, currentUses: 1, tier: 'pro_monthly', trialDays: 30 });
          } else {
            throw new Error("InvalidCoupon");
          }
        } else {
          const data = couponDoc.data();
          if (data.currentUses >= data.maxUses) {
            throw new Error("CouponDepleted");
          }
          transaction.update(couponRef, { currentUses: data.currentUses + 1 });
        }
        
        // Update User
        const userRef = doc(db, 'users', userId);
        const data = couponDoc.exists() ? couponDoc.data() : { tier: code === 'PREMMC04' ? 'pro_lifetime' : (code === 'DEMO' || code === 'EMPMANUELITA' ? 'pro_monthly' : 'pro_annual'), trialDays: code === 'DEMO' ? 30 : null };
        const tier = data.tier;
        const updateData: any = { subscriptionTier: tier };
        
        if (tier === 'pro_monthly') {
           const expiration = new Date();
           expiration.setDate(expiration.getDate() + 30);
           updateData.subscriptionExpiresAt = expiration.toISOString();
        } else if (tier === 'pro_annual') {
           const expiration = new Date();
           expiration.setDate(expiration.getDate() + 365);
           updateData.subscriptionExpiresAt = expiration.toISOString();
        } else {
           updateData.subscriptionExpiresAt = null; // Lifetime
        }
        
        transaction.update(userRef, updateData);
        return tier as SubscriptionTier;
      });

      onUpgrade(isSuccess);
      alert('¡Cupón canjeado exitosamente!');
      setShowCouponInput(false);
      setCouponCode('');
    } catch (e: any) {
      console.error(e);
      if (e.message === "InvalidCoupon") {
        setCouponError('El código de convenio no es válido.');
      } else if (e.message === "CouponDepleted") {
         setCouponError('Este código ha superado su límite de redenciones admitidas.');
      } else {
        setCouponError('Ocurrió un error al canjear el cupón.');
      }
    } finally {
      setLoading(null);
    }
  };

  const isPro = currentTier !== 'free';

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in pb-10">
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <span className="material-symbols-outlined text-[80px]">payments</span>
        </div>
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 z-10">
          <span className="material-symbols-outlined text-[32px] text-amber-400">workspace_premium</span>
        </div>
        <h2 className="text-2xl font-black mb-2 tracking-tight z-10">Fin<span className="text-emerald-400">APP</span> Pro</h2>
        <p className="text-sm text-indigo-200 font-medium max-w-[280px] z-10">
          Desbloquea el modo familiar y lleva tus finanzas al siguiente nivel. Pagos seguros vía Wompi.
        </p>
      </div>

      {!isPro && (
        <div className="flex flex-col gap-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="border-2 border-indigo-100 bg-white p-6 rounded-3xl shadow-sm flex flex-col relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-bl-xl font-bold text-[10px] uppercase tracking-wider">
              Popular
            </div>
            <h3 className="text-lg font-black text-slate-800">{plans.pro_monthly.label}</h3>
            <p className="text-sm font-medium text-slate-500 mb-4">{plans.pro_monthly.desc}</p>
            <div className="mb-6"><span className="text-3xl font-black text-indigo-600">${plans.pro_monthly.priceCOP.toLocaleString()}</span><span className="text-sm text-slate-400"> COP/mes</span></div>
            <button 
              onClick={() => handleWompiCheckout('pro_monthly')}
              disabled={loading !== null}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-200"
            >
              {loading === 'pro_monthly' ? 'Procesando...' : 'Pagar con Wompi'}
            </button>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="border-2 border-slate-200 bg-slate-50 p-6 rounded-3xl shadow-sm flex flex-col relative"
          >
            <h3 className="text-lg font-black text-slate-800">{plans.pro_annual.label}</h3>
            <p className="text-sm font-medium text-slate-500 mb-4">{plans.pro_annual.desc}</p>
            <div className="mb-6"><span className="text-3xl font-black text-slate-800">${plans.pro_annual.priceCOP.toLocaleString()}</span><span className="text-sm text-slate-400"> COP/año</span></div>
            <button 
              onClick={() => handleWompiCheckout('pro_annual')}
              disabled={loading !== null}
              className="bg-white border-2 border-slate-300 hover:border-slate-800 text-slate-800 font-bold py-3.5 rounded-xl transition-all"
            >
              {loading === 'pro_annual' ? 'Procesando...' : 'Pagar con Wompi'}
            </button>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="border-2 border-amber-200 bg-amber-50 p-6 rounded-3xl shadow-sm flex flex-col relative overflow-hidden"
          >
            <h3 className="text-lg font-black text-amber-900">{plans.pro_lifetime.label}</h3>
            <p className="text-sm font-medium text-amber-700 mb-4">{plans.pro_lifetime.desc}</p>
            <div className="mb-6"><span className="text-3xl font-black text-amber-600">${plans.pro_lifetime.priceCOP.toLocaleString()}</span><span className="text-sm text-amber-700/50"> COP/pago único</span></div>
            <button 
              onClick={() => handleWompiCheckout('pro_lifetime')}
              disabled={loading !== null}
              className="bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 font-bold py-3.5 rounded-xl transition-all"
            >
              {loading === 'pro_lifetime' ? 'Procesando...' : 'Pagar con Wompi'}
            </button>
          </motion.div>
          
          {/* Sección de Convenios / Cupones */}
          <div className="mt-4 bg-slate-100 rounded-2xl p-5 border border-slate-200">
            {!showCouponInput ? (
              <div className="flex flex-col items-center text-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-3xl">redeem</span>
                <h4 className="text-sm font-bold text-slate-700">¿Tienes un código de convenio?</h4>
                <p className="text-xs text-slate-500 mb-2">Ingresa el cupón entregado por tu empresa (ej. Ing. Manuelita, USC, UNAD, DAXTREM) para obtener acceso gratuito.</p>
                <button 
                  onClick={() => setShowCouponInput(true)}
                  className="text-indigo-600 font-bold text-xs hover:underline"
                >
                  Canjear Cupón
                </button>
              </div>
            ) : (
              <form onSubmit={handleRedeemCoupon} className="flex flex-col gap-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Código de Beneficio
                </label>
                <input 
                  type="text" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Ej. DAXTREM"
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 uppercase focus:border-indigo-500 outline-none"
                />
                {couponError && <p className="text-xs text-red-500 font-bold">{couponError}</p>}
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowCouponInput(false)}
                    className="flex-1 py-3 font-bold text-slate-500 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={loading !== null || !couponCode.trim()}
                    className="flex-1 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs transition-colors disabled:opacity-50"
                  >
                    {loading === 'coupon' ? 'Verificando...' : 'Aplicar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {isPro && (
        <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-3xl flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">check_circle</span>
          <h3 className="text-lg font-black text-emerald-800 mb-1">Tu suscripción está activa</h3>
          <p className="text-sm font-medium text-emerald-600 mb-6">
            Tienes el plan <b>{currentTier === 'pro_monthly' ? 'Mensual' : currentTier === 'pro_annual' ? 'Anual' : 'Vitalicio'}</b>. Puedes invitar a 1 familiar a tu espacio.
          </p>
          
          <button 
            onClick={async () => {
              setLoading('cancel');
              try {
                const userRef = doc(db, 'users', userId);
                await updateDoc(userRef, { subscriptionTier: 'free' });
                onUpgrade('free');
              } catch(e) {
                console.error(e);
              } finally {
                setLoading(null);
              }
            }}
            disabled={loading !== null}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 underline"
          >
            {loading === 'cancel' ? 'Cancelando...' : 'Cancelar Suscripción o Vínculo'}
          </button>
        </div>
      )}

      {showWompiMissingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative overflow-hidden flex flex-col"
          >
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={() => setShowWompiMissingModal(false)}
                className="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-500 text-2xl">workspace_premium</span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">Pasarela de Pagos</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">FinAPP Pro Web Checkout</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Para proceder con el pago real en producción mediante Wompi, el sistema requiere configurar la variable de entorno <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px] text-indigo-600 font-bold">VITE_WOMPI_PUBLIC_KEY</code> o <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px] text-indigo-600 font-bold">WOMPI_PUBLIC_KEY</code> en las configuraciones de hosting de tu servidor (Cloud Run).
            </p>
            
            <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 flex flex-col gap-2 mb-6">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">info</span> Nota de Configuración:
              </span>
              <p className="text-xs text-amber-700 leading-normal">
                Si esta variable ya fue configurada en el panel de Cloud Run, asegúrate de haber reiniciado o redesplegado el contenedor para que comience a servir el checkout correctamente de forma dinámica.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowWompiMissingModal(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-200 text-xs text-center flex items-center justify-center"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
