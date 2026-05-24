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

  // Precios en COP (Simulados para Wompi, en centavos y en formato de vista)
  const plans = {
    pro_monthly: { label: 'Mensual', priceCOP: 19900, cents: 1990000, desc: 'Manejo de finanzas con 1 familiar extra.' },
    pro_annual: { label: 'Anual', priceCOP: 145900, cents: 14590000, desc: 'Ahorra un 15% pagando el año completo.' },
    pro_lifetime: { label: 'Vitalicia', priceCOP: 259900, cents: 25990000, desc: 'Paga una sola vez y disfruta de FinAPP Pro para siempre.' },
  };

  useEffect(() => {
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
       const url = env === 'test' ? `https://sandbox.wompi.co/v1/transactions/${txId}` : `https://production.wompi.co/v1/transactions/${txId}`;
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
    setLoading(tier);
    const publicKey = import.meta.env.VITE_WOMPI_PUBLIC_KEY;
    
    if (!publicKey) {
      alert("La llave pública de Wompi no está configurada.");
      setLoading(null);
      return;
    }

    // Integración real Web Checkout Wompi
    const reference = `FINAPP-${tier}-${userId}-${Date.now()}`;
    const amountInCents = plans[tier as keyof typeof plans].cents;
    const redirectUrl = window.location.origin + window.location.pathname + '?tab=subscription';
    
    const checkoutUrl = `https://checkout.wompi.co/p/?public-key=${publicKey}&currency=COP&amount-in-cents=${amountInCents}&reference=${reference}&redirect-url=${encodeURIComponent(redirectUrl)}`;
    
    window.location.href = checkoutUrl;
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
            transaction.set(couponRef, { maxUses: 500, currentUses: 1, tier: 'pro_monthly' });
          } else if (code === 'PREMMC04') {
            transaction.set(couponRef, { maxUses: 50, currentUses: 1, tier: 'pro_lifetime' });
          } else if (code === 'DEMO') {
            transaction.set(couponRef, { maxUses: 1, currentUses: 1, tier: 'pro_monthly', trialDays: 30 });
          } else if (['COLSUBSIDIO2026', 'PROTECCION_PRO', 'FINAPP_FAMILIA'].includes(code)) {
            transaction.set(couponRef, { maxUses: 1000, currentUses: 1, tier: 'pro_annual' });
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
        <h2 className="text-2xl font-black mb-2 tracking-tight z-10">FinAPP Pro</h2>
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
                <p className="text-xs text-slate-500 mb-2">Ingresa el cupón entregado por tu empresa (ej. Compensar, Colsubsidio) para obtener acceso gratuito.</p>
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
                  placeholder="Ej. COLSUBSIDIO2026"
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
              // Simulador para cancelar la suscripcion en DEMO
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
            {loading === 'cancel' ? 'Cancelando...' : 'Cancelar Suscripción o Vínculo (Modo Demo)'}
          </button>
        </div>
      )}
    </div>
  );
}
