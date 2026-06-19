import React, { useState } from 'react';
import { AvatarOption, AVATAR_OPTIONS, FixedTransaction } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { FixedTransactionsEditor } from './FixedTransactionsEditor';

interface SettingsModalProps {
  currentName: string;
  currentAvatar: AvatarOption;
  currentCurrency: string;
  isFamilyMode?: boolean;
  fixedTransactions: FixedTransaction[];
  onSave: (name: string, avatar: AvatarOption, currency: string, fixedItems: FixedTransaction[]) => void;
  onClose: () => void;
  onLogout: () => void;
  onLeaveFamily?: () => void;
}

export function SettingsModal({
  currentName,
  currentAvatar,
  currentCurrency,
  isFamilyMode,
  fixedTransactions,
  onSave,
  onClose,
  onLogout,
  onLeaveFamily,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'recurrences'>('profile');
  
  const [name, setName] = useState(currentName);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption>(currentAvatar);
  const [currency, setCurrency] = useState(currentCurrency);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  
  const [incomes, setIncomes] = useState<FixedTransaction[]>(fixedTransactions.filter(t => t.type === 'income'));
  const [expenses, setExpenses] = useState<FixedTransaction[]>(fixedTransactions.filter(t => t.type === 'expense'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name, selectedAvatar, currency, [...incomes, ...expenses]);
  };

  return (
    <div id="settings-modal" className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-up text-left">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-50 transition-colors border border-slate-200 cursor-pointer z-10"
        >
          <span className="material-symbols-outlined block text-base font-bold">close</span>
        </button>

        {/* Header Title */}
        <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-2xl text-indigo-600 font-bold">settings</span>
          Ajustes
        </h3>
        
        {/* Settings Navigation */}
        <div className="flex gap-2 mb-6 border-b border-slate-100 pb-2">
           <button 
             onClick={() => setActiveTab('profile')}
             className={`px-4 py-2 font-bold text-sm rounded-xl transition-all ${activeTab === 'profile' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Perfil
           </button>
           <button 
             onClick={() => setActiveTab('recurrences')}
             className={`px-4 py-2 font-bold text-sm rounded-xl transition-all ${activeTab === 'recurrences' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Movimientos Fijos
           </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {activeTab === 'profile' ? (
            <div className="flex flex-col gap-4 animate-fade-in">
              {/* Avatar Options */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Avatar</label>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedAvatar(opt)}
                      className={`relative flex items-center justify-center w-14 h-14 p-2 rounded-xl border transition-all duration-150 outline-none cursor-pointer ${
                        selectedAvatar.id === opt.id 
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50 scale-105' 
                          : 'border-slate-200 bg-slate-50 opacity-60 hover:opacity-100 hover:bg-slate-100'
                      }`}
                      title={opt.name}
                    >
                      <div className={`w-full h-full ${opt.animationClass}`}>
                        <img src={opt.imageUrl} alt={opt.name} className="w-full h-full object-cover rounded-full" />
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-center text-slate-400 font-bold mt-2">
                  Estado seleccionado: <span className="underline font-bold text-slate-700">{selectedAvatar.name}</span>
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Laura Pérez"
                  maxLength={20}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500 font-bold placeholder-slate-400"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Moneda Base</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 outline-none cursor-pointer focus:border-indigo-500"
                >
                  <option value="COP">COP (Pesos Colombianos 🇨🇴)</option>
                  <option value="USD">USD (Dólares 💵)</option>
                  <option value="EUR">EUR (Euros 💶)</option>
                  <option value="MXN">MXN (Pesos Mexicanos 🇲🇽)</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-fade-in bg-slate-900 p-4 -mx-2 rounded-2xl">
               <div>
                 <h4 className="text-white font-black text-base flex items-center gap-2 mb-2">
                   <span className="material-symbols-outlined text-emerald-400">payments</span>
                   Ingresos Fijos
                 </h4>
                 <div className="bg-slate-800 rounded-xl p-1">
                   <FixedTransactionsEditor type="income" items={incomes} onChange={setIncomes} />
                 </div>
               </div>
               <div>
                 <h4 className="text-white font-black text-base flex items-center gap-2 mb-2">
                   <span className="material-symbols-outlined text-rose-400">home</span>
                   Gastos Fijos
                 </h4>
                 <div className="bg-slate-800 rounded-xl p-1">
                   <FixedTransactionsEditor type="expense" items={expenses} onChange={setExpenses} />
                 </div>
               </div>
            </div>
          )}

          <div className="flex flex-col gap-2 w-full mt-4">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-black text-sm transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              Guardar Cambios
            </button>
            
            {activeTab === 'profile' && (
              <div className="flex flex-col gap-2 w-full mt-4 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full bg-slate-50 hover:bg-red-50 hover:border-red-200 text-slate-500 hover:text-red-600 border border-slate-200 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  Cerrar Sesión
                </button>
                {isFamilyMode && onLeaveFamily && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmLeave(true)}
                    className="w-full bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 py-3 rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">group_remove</span>
                    Abandonar / Eliminar Familia
                  </button>
                )}
                <a
                  href="https://wa.me/573026289147?text=Hola%2C%20necesito%20soporte%20con%20mi%20cuenta%20de%20FinAPP"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-3 rounded-xl font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                  </svg>
                  Soporte por WhatsApp
                </a>
              </div>
            )}
          </div>
        </form>
      </div>

      <AnimatePresence>
        {showConfirmLeave && onLeaveFamily && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative flex flex-col items-center justify-center p-8 text-center"
            >
               <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-5 border-4 border-orange-100">
                  <span className="material-symbols-outlined text-4xl">group_remove</span>
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">¿Abandonar Familia?</h3>
               <p className="text-sm font-semibold text-slate-500 mb-8 leading-relaxed">
                  ¿Estás seguro de que quieres abandonar o eliminar esta familia? Perderás acceso a los movimientos familiares.
               </p>
               <div className="flex gap-4 w-full">
                 <motion.button 
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => setShowConfirmLeave(false)}
                   className="flex-1 px-4 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-colors border-2 border-slate-200"
                 >
                   Cancelar
                 </motion.button>
                 <motion.button 
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => {
                     onLeaveFamily();
                     setShowConfirmLeave(false);
                   }}
                   className="flex-1 px-4 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black rounded-2xl shadow-lg shadow-orange-500/30 border border-orange-400"
                 >
                   Confirmar
                 </motion.button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
