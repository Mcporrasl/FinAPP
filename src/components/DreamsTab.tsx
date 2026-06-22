import React, { useState, useEffect } from 'react';
import { Goal, GoalType, FamilyData, Transaction } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { PiggyLogo } from './PiggyLogo';

interface DreamsTabProps {
  goals: Goal[];
  transactions?: Transaction[];
  onAddAmountToGoal: (goalId: string, amount: number, createdBy?: string, createdByAvatar?: string) => void;
  onAddNewGoal: (goal: Omit<Goal, 'id' | 'currentAmount' | 'completed' | 'dateCreated'>) => void;
  onDeleteGoal: (goalId: string) => void;
  isFamilyMode?: boolean;
  familyData?: FamilyData | null;
}

export function DreamsTab({
  goals,
  transactions,
  onAddAmountToGoal,
  onAddNewGoal,
  onDeleteGoal,
  isFamilyMode,
  familyData,
}: DreamsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newType, setNewType] = useState<GoalType>('DEBT');
  const [newIcon, setNewIcon] = useState('credit_card_off');
  const [deleteConfirmGoalId, setDeleteConfirmGoalId] = useState<string | null>(null);

  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => {
    if (familyData && familyData.members.length > 0) {
      return familyData.members[0].id;
    }
    return 'm-1';
  });

  useEffect(() => {
    if (familyData && familyData.members.length > 0) {
      const exists = familyData.members.some(m => m.id === selectedMemberId);
      if (!exists) {
        setSelectedMemberId(familyData.members[0].id);
      }
    }
  }, [familyData, selectedMemberId]);

  // Realistic goal category icons for 50/30/20 users fighting debt and building savings
  const workerIcons = [
    { name: 'credit_card_off', label: 'Pago Deuda' },
    { name: 'money_off', label: 'Libre de Crédito' },
    { name: 'savings', label: 'Fondo Emergencia' },
    { name: 'trending_up', label: 'Inversión' },
    { name: 'home_work', label: 'Cuota Vivienda' },
    { name: 'school', label: 'Educación' }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(val);
  };

  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [goalToFund, setGoalToFund] = useState<Goal | null>(null);
  const [fundAmount, setFundAmount] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const targetVal = parseFloat(newTarget.replace(/[^0-9]/g, '')) || 0;
    if (targetVal <= 0) return;

    onAddNewGoal({
      title: newTitle,
      description: 'Avance registrado en finanzas',
      type: newType,
      icon: newIcon,
      targetAmount: targetVal
    });

    setNewTitle('');
    setNewTarget('');
    setNewType('DEBT');
    setNewIcon('credit_card_off');
    setIsModalOpen(false);
  };

  const openFundModal = (goal: Goal) => {
    setGoalToFund(goal);
    setFundAmount('');
    setFundModalOpen(true);
  };

  const handleFundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalToFund) {
      const val = parseFloat(fundAmount.replace(/[^0-9]/g, ''));
      if (val > 0) {
        const activeMember = isFamilyMode && familyData
          ? familyData.members.find(m => m.id === selectedMemberId)
          : null;

        onAddAmountToGoal(
          goalToFund.id, 
          val, 
          activeMember ? activeMember.name : undefined, 
          activeMember ? activeMember.avatarUrl : undefined
        );
        setFundModalOpen(false);
        setGoalToFund(null);
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } }
  };

  // ⚡ Bolt: Moved O(N) transaction calculations out of the goals.map() loop to prevent O(M * N) complexity.
  // Memoizing these calculations so they only run when transactions change, not on every render.
  const { totalIncome, actualSavings } = React.useMemo(() => {
    let income = 0;
    let savings = 0;
    if (transactions) {
      for (const t of transactions) {
        if (t.type === 'income') income += t.amount;
        if (t.category === '20_SAVINGS') savings += t.amount;
      }
    }
    return { totalIncome: income, actualSavings: savings };
  }, [transactions]);

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
      className="pb-32 flex flex-col gap-6 w-full text-left"
    >
      
      <section className="text-center md:text-left mt-2 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center justify-center md:justify-start gap-2 leading-none">
            <span className="material-symbols-outlined text-emerald-600 text-3xl font-bold bg-emerald-50 p-2 rounded-xl">flag</span>
            Metas y Deudas Activas
          </h2>
          <p className="text-slate-500 font-semibold text-sm mt-2 text-center md:text-left">
            Usa el 20% de tus ingresos para salir de deudas o ahorrar.
          </p>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white hover:bg-slate-800 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center gap-2 cursor-pointer shadow-lg border border-slate-800"
        >
          <span className="material-symbols-outlined text-xl font-bold">add_task</span>
          Crear Nueva Meta
        </motion.button>
      </section>

      {/* Grid of Goals */}
      <div className="grid grid-cols-1 gap-5 w-full">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const isFunded = goal.currentAmount >= goal.targetAmount;
          
          const idealSavings = totalIncome * 0.2;
          const projectedMonthlySavings = Math.max(idealSavings, actualSavings);
          const isUsingActualSavings = actualSavings > idealSavings;
          const projectionContext = isUsingActualSavings ? 'al ritmo de ahorro actual' : 'con ahorro ideal del 20%';
          
          const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
          let projectionText = '';
          let projectionIcon = '';
          if (!isFunded && projectedMonthlySavings > 0) {
            const monthsRemaining = Math.max(1, Math.ceil(remainingAmount / projectedMonthlySavings));
            if (monthsRemaining === 1) {
              projectionText = "Materializable en 1 mes";
              projectionIcon = "speed";
            } else if (monthsRemaining <= 12) {
              projectionText = `Materializable en ~${monthsRemaining} meses`;
              projectionIcon = "event";
            } else {
              const years = (monthsRemaining / 12).toFixed(1);
              projectionText = `Materializable en ~${years} años`;
              projectionIcon = "event_available";
            }
          } else if (!isFunded && projectedMonthlySavings === 0) {
            projectionText = "Añade ingresos para estimación";
            projectionIcon = "help";
          }
          
          const isDebt = goal.type === 'DEBT';
          const cardBorder = isDebt ? 'border-rose-200' : 'border-indigo-200';
          const shadowColor = isDebt ? 'shadow-rose-100/50' : 'shadow-indigo-100/50';
          const iconBg = isDebt ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600';
          const pgBar = isDebt ? 'bg-gradient-to-r from-rose-500 to-orange-500' : 'bg-gradient-to-r from-indigo-500 to-cyan-500';

          return (
            <motion.div 
              variants={cardVariants}
              whileHover={{ scale: 1.02 }}
              key={goal.id}
              className={`bg-white border-2 rounded-3xl p-6 shadow-xl relative flex flex-col gap-4 ${cardBorder} ${shadowColor}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold ${iconBg} shadow-inner`}>
                    <span className="material-symbols-outlined text-3xl">{goal.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xl font-black text-slate-800 leading-tight">{goal.title}</h3>
                    <span className="text-[10px] font-black text-slate-400 tracking-wider mt-1 uppercase">
                      {isDebt ? '💳 PAGO DE DEUDA' : '💰 AHORRO/PRÉSTAMO'}
                    </span>
                  </div>
                </div>
                
                {isFunded && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="bg-emerald-100 text-emerald-800 border-2 border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                     <span className="material-symbols-outlined text-base">verified</span> Completado
                  </motion.span>
                )}
                {!isFunded && (
                   <button
                     onClick={() => setDeleteConfirmGoalId(goal.id)}
                     className="bg-rose-50 text-rose-500 p-2 rounded-xl border border-rose-100 hover:bg-rose-100 shadow-sm"
                     title="Eliminar meta"
                   >
                     <span className="material-symbols-outlined text-base">delete</span>
                   </button>
                )}
              </div>

              {/* Progress Bar design */}
              <div className="w-full mt-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-end mb-2 font-bold text-sm">
                   <div className="flex flex-col">
                     <span className="text-[10px] text-slate-400 uppercase tracking-wide">Actual</span>
                     <span className="text-slate-800 text-lg">$ {formatCurrency(goal.currentAmount)}</span>
                   </div>
                   <div className="flex flex-col text-right">
                     <span className="text-[10px] text-slate-400 uppercase tracking-wide">Meta</span>
                     <span className="text-slate-500 font-semibold">$ {formatCurrency(goal.targetAmount)}</span>
                   </div>
                </div>
                <div className="relative h-4 w-full rounded-full bg-slate-200/60 overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className={`absolute left-0 h-full rounded-full ${pgBar} shadow-md`}
                  />
                </div>
                <div className="flex justify-between mt-2 items-center">
                  <p className={`text-xs font-black ${isDebt ? 'text-rose-500' : 'text-indigo-500'}`}>{pct}% Alcanzado</p>
                  {!isFunded && (
                     <p className="text-xs font-medium text-slate-400">Faltan $ {formatCurrency(remainingAmount)}</p>
                  )}
                </div>
                {!isFunded && projectionText && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-200/50 p-2 rounded-lg justify-center w-full">
                    <span className="material-symbols-outlined text-[14px]">{projectionIcon}</span>
                    <span>{projectionText} <span className="font-medium opacity-80">({projectionContext})</span></span>
                  </div>
                )}
              </div>

              {!isFunded && (
                 <motion.button 
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => openFundModal(goal)}
                   className="w-full mt-2 bg-white hover:bg-slate-50 text-slate-800 font-bold py-4 rounded-xl border-2 border-slate-200 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
                 >
                   <span className="material-symbols-outlined text-xl">add_circle</span>
                   Aportar a esta meta
                 </motion.button>
              )}
            </motion.div>
          );
        })}

        {goals.length === 0 && (
          <motion.div variants={cardVariants} className="text-center py-16 px-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center">
            <div className="mb-4 opacity-80">
              <PiggyLogo size={100} />
            </div>
            <p className="text-xl font-black text-slate-800">No hay metas registradas</p>
            <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto font-bold tracking-tight">Define tu primer objetivo financiero tocando "Crear Nueva Meta" arriba.</p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {/* Registration Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 text-left">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-8 shadow-2xl relative"
            >
              
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined block text-xl font-black">close</span>
              </button>

              <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2 tracking-tight">
                <span className="material-symbols-outlined text-3xl text-indigo-600 bg-indigo-50 p-1.5 rounded-xl">flag</span>
                Definir Meta
              </h3>

              <form onSubmit={handleCreate} className="flex flex-col gap-5">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nombre de la Meta</label>
                  <input 
                    type="text" 
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)} 
                    placeholder="Ej: Deuda Tarjeta, Viaje..." 
                    maxLength={30}
                    className="bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:bg-white font-bold placeholder-slate-400 transition-all"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monto Total Objetivo (COP)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-slate-400 font-bold">$</span>
                    <input 
                      type="text" 
                      value={newTarget} 
                      onChange={(e) => {
                         const cleaned = e.target.value.replace(/[^0-9]/g, '');
                         setNewTarget(cleaned ? parseInt(cleaned, 10).toLocaleString('es-CO') : '');
                      }}
                      placeholder="500.000" 
                      className="bg-slate-50 border-2 border-slate-200 rounded-xl w-full pl-8 pr-4 py-3.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:bg-white font-black placeholder-slate-400 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo de Meta</label>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setNewType('DEBT')}
                      className={`py-3.5 rounded-xl text-xs font-black border-2 transition-all flex flex-col items-center gap-1 ${
                        newType === 'DEBT' ? 'bg-rose-50 text-rose-700 border-rose-400 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="material-symbols-outlined">credit_card_off</span>
                      Salir de Deuda
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setNewType('SAVINGS')}
                      className={`py-3.5 rounded-xl text-xs font-black border-2 transition-all flex flex-col items-center gap-1 ${
                        newType === 'SAVINGS' ? 'bg-indigo-50 text-indigo-700 border-indigo-400 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="material-symbols-outlined">savings</span>
                      Ahorro / Inversión
                    </motion.button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ícono Representativo</label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-2 border-2 border-slate-100 rounded-2xl bg-slate-50">
                    {workerIcons.map((ico) => (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        key={ico.name}
                        type="button"
                        onClick={() => setNewIcon(ico.name)}
                        className={`p-3 rounded-xl flex flex-col items-center justify-center border-2 transition-all ${
                          newIcon === ico.name 
                            ? 'bg-white border-indigo-500 text-indigo-700 shadow-sm' 
                            : 'bg-transparent border-transparent text-slate-400 hover:bg-white hover:border-slate-200 hover:text-slate-600'
                        }`}
                        title={ico.label}
                      >
                        <span className="material-symbols-outlined text-2xl font-bold">{ico.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-slate-900 text-white py-4 mt-4 rounded-xl font-bold text-sm shadow-xl transition-all border border-slate-800 hover:bg-slate-800"
                >
                  Confirmar Meta 🚀
                </motion.button>

              </form>
            </motion.div>
          </div>
        )}

        {/* Fund Modal */}
        {fundModalOpen && goalToFund && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 text-left">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-8 shadow-2xl relative"
            >
              
              <button 
                onClick={() => {
                  setFundModalOpen(false);
                  setGoalToFund(null);
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined block text-xl font-bold">close</span>
              </button>

              <h3 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-3xl text-emerald-600 bg-emerald-50 p-1.5 rounded-xl">add_circle</span>
                Aportar a Meta
              </h3>
              <p className="text-sm font-bold text-slate-500 mb-6 bg-slate-50 p-2 rounded-lg border border-slate-100 truncate">{goalToFund.title}</p>

              <form onSubmit={handleFundSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex justify-between">
                    <span>Monto del Abono (COP)</span>
                    <span className="text-indigo-500 font-bold">Disponible: ${
                      new Intl.NumberFormat('es-CO').format(Math.max(0, (totalIncome * 0.2) - actualSavings))
                    }</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-slate-400 font-bold">$</span>
                    <input 
                      type="text" 
                      value={fundAmount} 
                      inputMode="numeric"
                      onChange={(e) => {
                         const cleaned = e.target.value.replace(/[^0-9]/g, '');
                         const val = cleaned ? parseInt(cleaned, 10) : 0;
                         
                         setFundAmount(cleaned ? val.toLocaleString('es-CO') : '');
                      }}
                      placeholder="50.000" 
                      className="bg-slate-50 border-2 border-slate-200 rounded-xl w-full pl-8 pr-4 py-3.5 text-lg text-slate-800 outline-none focus:border-emerald-500 focus:bg-white font-black placeholder-slate-400 transition-all text-center"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 text-center -mt-1">
                    El monto se restará del presupuesto de Ahorros (20%).
                  </p>
                </div>

                {isFamilyMode && familyData && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">¿Quién realiza el abono?</label>
                    <div className="flex gap-1.5 overflow-x-auto py-1">
                      {familyData.members.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => setSelectedMemberId(member.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 font-black text-xs flex-shrink-0 transition-all cursor-pointer ${
                            selectedMemberId === member.id 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-800 shadow-sm' 
                              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <img src={member.avatarUrl || 'https://api.dicebear.com/9.x/micah/svg?seed=Unknown'} alt={member.name} className="w-5 h-5 rounded-full" />
                          <span>{member.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 mt-2 rounded-xl font-bold text-sm shadow-xl shadow-emerald-500/30 transition-all border border-emerald-400"
                >
                  Registrar Abono
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmGoalId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative flex flex-col items-center justify-center p-8 text-center"
            >
               <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-5 border-4 border-rose-100">
                  <span className="material-symbols-outlined text-4xl">delete</span>
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">¿Eliminar Meta?</h3>
               <p className="text-sm font-semibold text-slate-500 mb-8 leading-relaxed">
                  ¿Estás seguro de que quieres eliminar esta meta? Se recuperará el dinero ingresado a tu balance principal.
               </p>
               <div className="flex gap-4 w-full">
                 <motion.button 
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => setDeleteConfirmGoalId(null)}
                   className="flex-1 px-4 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-colors border-2 border-slate-200"
                 >
                   Cancelar
                 </motion.button>
                 <motion.button 
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => {
                     onDeleteGoal(deleteConfirmGoalId);
                     setDeleteConfirmGoalId(null);
                   }}
                   className="flex-1 px-4 py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-black rounded-2xl shadow-lg shadow-rose-500/30 border border-rose-400"
                 >
                   Eliminar
                 </motion.button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
