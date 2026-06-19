import React, { useState } from 'react';
import { Transaction, Goal, FamilyData, CategoryType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CategoryAnalysisModal } from './CategoryAnalysisModal';
import { currencyFormatter } from '../utils/format';

function CopyInviteButton({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <motion.button 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleCopy}
      className={`bg-white border-2 border-emerald-100 px-3 py-1.5 rounded-xl text-xs font-black shadow-sm flex items-center gap-1 transition-colors ${copied ? 'text-emerald-700 bg-emerald-50' : 'text-emerald-700'}`}
    >
      <span className="material-symbols-outlined text-[14px]">
        {copied ? 'check' : 'content_copy'}
      </span>
      {copied ? 'Copiado' : 'Código'}
    </motion.button>
  );
}

interface HomeTabProps {
  userName: string;
  transactions: Transaction[];
  goals: Goal[];
  onAddTransaction: () => void;
  isFamilyMode?: boolean;
  familyData?: FamilyData | null;
  onUpdateFamilyMembers?: (members: any[]) => void;
}

export function HomeTab({
  userName,
  transactions,
  goals,
  onAddTransaction,
  isFamilyMode,
  familyData,
  onUpdateFamilyMembers
}: HomeTabProps) {

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedAnalysisCategory, setSelectedAnalysisCategory] = useState<CategoryType | null>(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAvatar, setNewMemberAvatar] = useState('https://api.dicebear.com/9.x/micah/svg?seed=Jack');

  const avatarSeeds = ['Jack', 'Lily', 'Max', 'Luna', 'Oliver', 'Molly', 'Leo', 'Bella', 'Charlie', 'Lucy', 'Felix', 'Chloe'];

  const formatCurrency = (val: number) => {
    return currencyFormatter.format(val);
  };

  // Calculate distributions based on current month (or all time for simplicity)
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  
  const needsTotal = transactions.filter(t => t.category === '50_NEEDS').reduce((acc, t) => acc + t.amount, 0);
  const wantsTotal = transactions.filter(t => t.category === '30_WANTS').reduce((acc, t) => acc + t.amount, 0);
  const savingsDebtTotal = transactions.filter(t => t.category === '20_SAVINGS').reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = needsTotal + wantsTotal + savingsDebtTotal;
  const balance = totalIncome - totalExpense;

  // Percentage relative to BUDGET (for limits) vs ACTUAL distribution (for adaptive behavior)
  const needsBudget = totalIncome * 0.5;
  const wantsBudget = totalIncome * 0.3;
  const savingsBudget = totalIncome * 0.2;

  // Adaptive actual percentages (what % of total income actually went to this category)
  const actualNeedsPct = totalIncome > 0 ? (needsTotal / totalIncome) * 100 : 0;
  const actualWantsPct = totalIncome > 0 ? (wantsTotal / totalIncome) * 100 : 0;
  const actualSavingsPct = totalIncome > 0 ? (savingsDebtTotal / totalIncome) * 100 : 0;

  const getPct = (actual: number, budget: number) => {
    if (budget === 0) return 0;
    return Math.min(100, Math.round((actual / budget) * 100));
  }

  const needsPct = getPct(needsTotal, needsBudget); // How much of the 50% budget is used
  const wantsPct = getPct(wantsTotal, wantsBudget);
  const savingsPct = getPct(savingsDebtTotal, savingsBudget);

  const getAdaptiveColor = (actualPct: number, idealPct: number) => {
    if (actualPct > idealPct + 10) return 'text-red-500 bg-red-50';
    if (actualPct > idealPct) return 'text-amber-500 bg-amber-50';
    if (actualPct === 0) return 'text-slate-400 bg-slate-50';
    return 'text-emerald-500 bg-emerald-50';
  };

  const progressColor = (pct: number) => {
    if (pct > 100) return 'bg-red-500';
    if (pct > 85) return 'bg-amber-400';
    return 'bg-emerald-500';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
      className="flex flex-col items-center gap-6 w-full pb-32"
    >
      {/* Intro Header */}
      <motion.div variants={itemVariants} className="w-full text-left mt-2">
        <h2 className="text-2xl flex flex-col font-black text-slate-800 tracking-tight">
           {isFamilyMode ? `¡Hola, ${familyData?.name || 'Familia'}! 👋` : `¡Hola, ${userName}! 👋`}
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-1">
          {isFamilyMode ? 'Progreso financiero familiar compartido.' : 'Este es el estado de tu regla financiera 50/30/20.'}
        </p>
      </motion.div>

      {/* Family Manage Modal Toggle */}
      {isFamilyMode && familyData && (
        <motion.div 
          variants={itemVariants} 
          className="w-full bg-emerald-50/70 border-2 border-emerald-100 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-emerald-50 transition-colors"
          onClick={() => setIsManageModalOpen(true)}
        >
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-black shadow-inner">
                <span className="material-symbols-outlined text-[24px]">group</span>
             </div>
             <div>
                <p className="text-sm font-black text-slate-800 tracking-tight">Gestionar Familia</p>
                <p className="text-xs font-bold text-emerald-700 mt-0.5">{familyData.members.length} miembros unidos</p>
             </div>
          </div>
          <div className="flex gap-2">
            <CopyInviteButton inviteCode={familyData.inviteCode} />
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsManageModalOpen(true);
              }}
              className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-sm"
            >
              Miembros
            </motion.button>
          </div>
        </motion.div>
      )}

        {/* Main Balance Overview */}
      <motion.div 
        variants={itemVariants} 
        whileHover={{ scale: 1.02 }}
        className="w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden group"
      >
        {/* Decorative background elements */}
        <div className="absolute inset-x-0 bottom-0 z-0 h-40 opacity-40 select-none pointer-events-none group-hover:opacity-60 transition-opacity duration-700">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,100 L0,50 Q20,80 40,40 T80,30 T100,10 L100,100 Z" fill="url(#grad1)" />
            <path d="M0,100 L0,70 Q30,90 60,50 T100,30 L100,100 Z" fill="url(#grad2)" opacity="0.6" />
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl mix-blend-screen group-hover:bg-emerald-400/20 transition-all duration-700"></div>

        <div className="flex flex-col gap-2 z-10 w-full mb-6 relative">
           <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase opacity-90">Saldo Disponible</h3>
           <p className="text-5xl font-black flex items-baseline gap-2 tracking-tighter">
             <span className="text-emerald-400 font-bold opacity-80">$</span> 
             {formatCurrency(balance)}
           </p>
        </div>

        <div className="grid grid-cols-2 gap-6 border-t border-slate-700/60 pt-5 relative z-10">
           <div>
             <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Ingresos Base</span>
             <p className="text-base font-bold text-emerald-400 drop-shadow-md">+ $ {formatCurrency(totalIncome)}</p>
           </div>
           <div>
             <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Egresos Totales</span>
             <p className="text-base font-bold text-pink-400 drop-shadow-md">- $ {formatCurrency(totalExpense)}</p>
           </div>
        </div>
      </motion.div>

      {/* 50/30/20 Breakdown Section */}
      <motion.div variants={itemVariants} className="w-full flex flex-col gap-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
             <span className="material-symbols-outlined text-emerald-600 text-xl font-bold bg-emerald-50 p-1.5 rounded-lg">donut_small</span>
             Tu Distribución Real
          </h3>
        </div>

        {/* 50% Needs */}
        <motion.div 
          onClick={() => setSelectedAnalysisCategory('50_NEEDS')}
          whileHover={{ scale: 1.01 }} 
          whileTap={{ scale: 0.98 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 cursor-pointer"
        >
           <div className="flex justify-between items-end">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
                 <span className="material-symbols-outlined text-[20px] font-bold">home</span>
               </div>
               <div>
                 <p className="text-sm font-extrabold text-slate-800">Básicos / Necesidades</p>
                 <p className="text-xs font-semibold text-slate-400">Ideal: 50% ($ {formatCurrency(needsBudget)})</p>
               </div>
             </div>
             <div className="text-right">
                <p className={`text-base font-black ${needsPct > 100 ? 'text-red-600' : 'text-slate-800'}`}>$ {formatCurrency(needsTotal)}</p>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold mt-1 ${getAdaptiveColor(actualNeedsPct, 50)}`}>
                  {actualNeedsPct.toFixed(1)}% Real
                </div>
             </div>
           </div>
           <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mt-1 relative border border-slate-200/60">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${Math.min(100, needsPct)}%` }}
               transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
               className={`absolute top-0 left-0 h-full rounded-full ${progressColor(needsPct)}`}
             />
           </div>
        </motion.div>

        {/* 30% Wants */}
        <motion.div 
          onClick={() => setSelectedAnalysisCategory('30_WANTS')}
          whileHover={{ scale: 1.01 }} 
          whileTap={{ scale: 0.98 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 cursor-pointer"
        >
           <div className="flex justify-between items-end">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100 shadow-sm">
                 <span className="material-symbols-outlined text-[20px] font-bold">shopping_bag</span>
               </div>
               <div>
                 <p className="text-sm font-extrabold text-slate-800">Gustos / Deseos</p>
                 <p className="text-xs font-semibold text-slate-400">Ideal: 30% ($ {formatCurrency(wantsBudget)})</p>
               </div>
             </div>
             <div className="text-right">
                <p className={`text-base font-black ${wantsPct > 100 ? 'text-red-600' : 'text-slate-800'}`}>$ {formatCurrency(wantsTotal)}</p>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold mt-1 ${getAdaptiveColor(actualWantsPct, 30)}`}>
                  {actualWantsPct.toFixed(1)}% Real
                </div>
             </div>
           </div>
           <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mt-1 relative border border-slate-200/60">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${Math.min(100, wantsPct)}%` }}
               transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
               className={`absolute top-0 left-0 h-full rounded-full ${progressColor(wantsPct)}`}
             />
           </div>
        </motion.div>

        {/* 20% Savings/Debts */}
        <motion.div 
          onClick={() => setSelectedAnalysisCategory('20_SAVINGS')}
          whileHover={{ scale: 1.01 }} 
          whileTap={{ scale: 0.98 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 cursor-pointer"
        >
           <div className="flex justify-between items-end">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                 <span className="material-symbols-outlined text-[20px] font-bold">account_balance</span>
               </div>
               <div>
                 <p className="text-sm font-extrabold text-slate-800">Ahorro / Deudas</p>
                 <p className="text-xs font-semibold text-slate-400">Ideal: 20% ($ {formatCurrency(savingsBudget)})</p>
               </div>
             </div>
             <div className="text-right">
                <p className={`text-base font-black ${savingsPct > 100 ? 'text-red-600' : 'text-slate-800'}`}>$ {formatCurrency(savingsDebtTotal)}</p>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold mt-1 ${getAdaptiveColor(actualSavingsPct, 20)}`}>
                  {actualSavingsPct.toFixed(1)}% Real
                </div>
             </div>
           </div>
           <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mt-1 relative border border-slate-200/60">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${Math.min(100, savingsPct)}%` }}
               transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
               className={`absolute top-0 left-0 h-full rounded-full ${progressColor(savingsPct)}`}
             />
           </div>
        </motion.div>
      </motion.div>

      {/* Primary Call to Action */}
      <motion.button 
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onAddTransaction}
        className="w-full mt-4 bg-slate-900 text-white py-5 px-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all outline-none select-none cursor-pointer border border-slate-800"
      >
        <span className="material-symbols-outlined text-2xl font-bold bg-white/10 p-1.5 rounded-lg flex-shrink-0">add</span>
        <span className="text-base font-black tracking-tight">Registrar Nuevo Movimiento</span>
      </motion.button>

      {/* Family Members Manager Modal */}
      <AnimatePresence>
        {isManageModalOpen && familyData && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 text-left">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white border-2 border-slate-100 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
            <button 
              onClick={() => setIsManageModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-50 border border-slate-200 cursor-pointer"
            >
              <span className="material-symbols-outlined block text-base font-bold">close</span>
            </button>

            <h3 className="text-lg font-black text-slate-800 mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-emerald-600">group</span>
              Miembros de la Familia
            </h3>
            <p className="text-xs font-semibold text-slate-400 mb-5">Administra los integrantes para asignarles ingresos, gastos y abonos.</p>

            {/* Members List */}
            <div className="flex flex-col gap-2.5 mb-6 max-h-[220px] overflow-y-auto pr-1">
              {familyData.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                  <div className="flex items-center gap-3">
                    <img src={member.avatarUrl || 'https://api.dicebear.com/9.x/micah/svg?seed=Unknown'} alt={member.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="text-xs font-black text-slate-800">{member.name}</p>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                        {member.role === 'admin' ? 'Administrador' : 'Miembro'}
                      </p>
                    </div>
                  </div>
                  {member.role !== 'admin' && onUpdateFamilyMembers && (
                    <button
                      onClick={() => {
                        const updated = familyData.members.filter(m => m.id !== member.id);
                        onUpdateFamilyMembers(updated);
                      }}
                      className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100 cursor-pointer text-xs font-bold"
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Member Form */}
            {onUpdateFamilyMembers && (
              <>
                {familyData.members.length >= 2 ? (
                  <div className="border-t border-slate-100 pt-4 flex flex-col gap-2 relative">
                     <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">¿Añadir Integrante?</p>
                     <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-lg text-xs font-medium text-center">
                        Has alcanzado el límite de 1 familiar adicional con tu suscripción plan Pro.
                     </div>
                  </div>
                ) : (
                  <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newMemberName.trim()) return;
                    const newMember = {
                      id: 'm-' + Date.now(),
                      name: newMemberName.trim(),
                      role: 'member' as const,
                      avatarUrl: newMemberAvatar
                    };
                    onUpdateFamilyMembers([...familyData.members, newMember]);
                    setNewMemberName('');
                  }}
                  className="border-t border-slate-100 pt-4 flex flex-col gap-3.5"
                >
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">¿Añadir Integrante?</p>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400">Nombre o Apodo</label>
                    <input
                      type="text"
                      required
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="Ej. Mamá, Carlos, Manuelita"
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-bold outline-none focus:border-indigo-500 placeholder-slate-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400">Seleccionar Avatar</label>
                    <div className="flex gap-2 overflow-x-auto py-2">
                      {avatarSeeds.map((seed) => {
                        const url = `https://api.dicebear.com/9.x/micah/svg?seed=${seed}&backgroundColor=e2e8f0`;
                        return (
                          <button
                            key={seed}
                            type="button"
                            onClick={() => setNewMemberAvatar(url)}
                            className={`w-12 h-12 p-1.5 rounded-full border-2 flex-shrink-0 transition-all cursor-pointer ${
                              newMemberAvatar === url 
                                ? 'border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-500/20' 
                                : 'border-slate-200 hover:bg-slate-50 bg-white'
                            }`}
                          >
                            <img src={url} alt={seed} className="w-full h-full object-cover rounded-full" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-black shadow-md mt-1 transition-all"
                  >
                    Agregar Integrante ➕
                  </button>
                </form>
                )}
              </>
            )}

          </motion.div>
        </div>
      )}
      </AnimatePresence>

      <CategoryAnalysisModal
        isOpen={!!selectedAnalysisCategory}
        onClose={() => setSelectedAnalysisCategory(null)}
        category={selectedAnalysisCategory}
        totalIncome={totalIncome}
        totalSpent={
          selectedAnalysisCategory === '50_NEEDS' ? needsTotal :
          selectedAnalysisCategory === '30_WANTS' ? wantsTotal :
          savingsDebtTotal
        }
        budget={
          selectedAnalysisCategory === '50_NEEDS' ? needsBudget :
          selectedAnalysisCategory === '30_WANTS' ? wantsBudget :
          savingsBudget
        }
        transactions={transactions}
      />
    </motion.div>
  );
}

