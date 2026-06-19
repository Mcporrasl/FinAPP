import React, { useState, useEffect } from 'react';
import { CategoryType, Transaction, FamilyData } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AddTabProps {
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'date'>, personalCategory?: CategoryType) => void;
  isFamilyMode?: boolean;
  familyData?: FamilyData | null;
}

export function AddTab({ onAddTransaction, isFamilyMode, familyData }: AddTabProps) {
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState<CategoryType>('50_NEEDS');
  const [personalCategory, setPersonalCategory] = useState<CategoryType>('50_NEEDS');
  const [amountStr, setAmountStr] = useState('0');
  const [description, setDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el usuario está escribiendo en el campo de descripción u otro input natural, no interferimos.
      const isInputFocused = document.activeElement?.tagName === 'INPUT' && (document.activeElement as HTMLInputElement).type === 'text' && (document.activeElement as HTMLInputElement).id !== 'calculator-amount-input';
      if (isInputFocused || showSuccess) return;

      const key = e.key;
      if (key >= '0' && key <= '9') {
        e.preventDefault();
        addDigit(key);
      } else if (key === '.' || key === ',') {
        e.preventDefault();
        addDigit('.');
      } else if (key === 'Backspace') {
        e.preventDefault();
        clearDigit();
      } else if (key === 'Enter') {
        e.preventDefault();
        if (parseFloat(amountStr) > 0) {
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [amountStr, showSuccess, category, txType, description]);

  const addDigit = (digit: string) => {
    setAmountStr(prev => {
      if (prev === '0') {
        if (digit === '.') return '0.';
        return digit;
      }
      if (digit === '.' && prev.includes('.')) return prev;
      return prev + digit;
    });
  };

  const clearDigit = () => {
    setAmountStr(prev => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleTxTypeChange = (type: 'expense' | 'income') => {
    setTxType(type);
    if (type === 'income') {
      setCategory('INCOME');
    } else {
      setCategory('50_NEEDS');
    }
  };

  const handleSave = () => {
    const amountVal = parseFloat(amountStr) || 0;
    if (amountVal <= 0) return;

    let icon = 'payments';
    if (category === '50_NEEDS') icon = 'shopping_cart';
    if (category === '30_WANTS') icon = 'restaurant';
    if (category === '20_SAVINGS') icon = 'account_balance';
    if (category === 'INCOME') icon = 'payments';

    const activeMember = isFamilyMode && familyData
      ? familyData.members.find(m => m.id === selectedMemberId)
      : null;

    const txData: any = {
      type: txType,
      amount: amountVal,
      category,
      description: description.trim() || (txType === 'income' ? 'Ingreso registrado' : 'Gasto registrado'),
      icon
    };

    if (activeMember) {
      txData.createdBy = activeMember.name;
      txData.createdByAvatar = activeMember.avatarUrl;
    }

    onAddTransaction(txData, isFamilyMode && txType === 'income' ? personalCategory : undefined);

    setShowSuccess(true);
    setAmountStr('0');
    setDescription('');
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

  const formatAmountForDisplay = (str: string) => {
    if (str === '0' || !str) return '';
    const [integerPart, decimalPart] = str.split('.');
    const formattedInteger = parseInt(integerPart || '0', 10).toLocaleString('es-CO');
    if (str.includes('.')) {
      return `${formattedInteger},${decimalPart}`;
    }
    return formattedInteger;
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
      className="pb-32 flex flex-col gap-6 w-full text-left"
    >
      
      <motion.div variants={itemVariants} className="text-center mt-2">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
          Registrar Movimiento
        </h2>
        <p className="text-slate-500 font-semibold text-sm mt-1">Añade ingresos o categoriza tus gastos.</p>
      </motion.div>

      {isFamilyMode && (
        <motion.div variants={itemVariants} className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-4 text-indigo-700 text-xs font-bold flex items-start gap-3 shadow-inner">
          <span className="material-symbols-outlined text-xl">info</span>
          <p className="leading-tight">
            {txType === 'income' 
              ? 'Al ingresar dinero al fondo familiar, se descontará automáticamente como un gasto de tu presupuesto personal.'
              : 'Al registrar un gasto familiar, este utilizará el saldo consolidado de la familia y no afectará tu presupuesto personal.'}
          </p>
        </motion.div>
      )}

      {/* Transaction Type Toggle */}
      <motion.div variants={itemVariants} className="flex bg-slate-100 p-1.5 rounded-2xl w-full border-2 border-slate-200">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleTxTypeChange('expense')}
          className={`flex-1 py-3.5 rounded-xl text-sm font-black transition-all border-2 ${
            txType === 'expense' ? 'bg-white text-slate-800 shadow-md border-slate-200/50' : 'text-slate-500 hover:text-slate-700 border-transparent'
          }`}
        >
          Salida (Gasto)
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleTxTypeChange('income')}
          className={`flex-1 py-3.5 rounded-xl text-sm font-black transition-all border-2 ${
            txType === 'income' ? 'bg-emerald-500 text-white shadow-md border-emerald-400' : 'text-slate-500 hover:text-slate-700 border-transparent'
          }`}
        >
          Entrada (Ingreso)
        </motion.button>
      </motion.div>

      {/* Selector de Miembro */}
      {isFamilyMode && familyData && (
        <motion.div variants={itemVariants} className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">¿Quién realiza este movimiento?</label>
          <div className="flex gap-2 w-full overflow-x-auto py-1">
            {familyData.members.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedMemberId(member.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border-2 font-black text-xs flex-shrink-0 transition-all cursor-pointer ${
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
        </motion.div>
      )}

      {/* Category Selection for Expense */}
      <AnimatePresence mode="popLayout">
        {txType === 'expense' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2 overflow-hidden"
          >
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Categoría Regla 50/30/20</label>
            <div className="grid grid-cols-3 gap-3">
               <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setCategory('50_NEEDS')}
                 className={`py-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${category === '50_NEEDS' ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
               >
                 <span className="material-symbols-outlined text-2xl">home</span>
                 <span className="text-[10px] font-black uppercase tracking-wider">Básicos (50%)</span>
               </motion.button>
               <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setCategory('30_WANTS')}
                 className={`py-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${category === '30_WANTS' ? 'bg-pink-50 border-pink-400 text-pink-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
               >
                 <span className="material-symbols-outlined text-2xl">shopping_bag</span>
                 <span className="text-[10px] font-black uppercase tracking-wider">Gustos (30%)</span>
               </motion.button>
               <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setCategory('20_SAVINGS')}
                 className={`py-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${category === '20_SAVINGS' ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
               >
                 <span className="material-symbols-outlined text-2xl">account_balance</span>
                 <span className="text-[10px] font-black uppercase tracking-wider">Ahorro/Deuda</span>
               </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Personal Source Category for Family Income */}
      <AnimatePresence mode="popLayout">
        {isFamilyMode && txType === 'income' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2 overflow-hidden"
          >
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">¿De qué categoría personal sale el dinero?</label>
            <div className="grid grid-cols-3 gap-3">
               <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setPersonalCategory('50_NEEDS')}
                 className={`py-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${personalCategory === '50_NEEDS' ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
               >
                 <span className="material-symbols-outlined text-2xl">home</span>
                 <span className="text-[10px] font-black uppercase tracking-wider">Básicos (50%)</span>
               </motion.button>
               <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setPersonalCategory('30_WANTS')}
                 className={`py-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${personalCategory === '30_WANTS' ? 'bg-pink-50 border-pink-400 text-pink-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
               >
                 <span className="material-symbols-outlined text-2xl">shopping_bag</span>
                 <span className="text-[10px] font-black uppercase tracking-wider">Gustos (30%)</span>
               </motion.button>
               <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setPersonalCategory('20_SAVINGS')}
                 className={`py-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${personalCategory === '20_SAVINGS' ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
               >
                 <span className="material-symbols-outlined text-2xl">account_balance</span>
                 <span className="text-[10px] font-black uppercase tracking-wider">Ahorro/Deuda</span>
               </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Description */}
      <motion.div variants={itemVariants} className="flex flex-col gap-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Descripción breve</label>
        <input 
          type="text" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={txType === 'expense' ? 'Ej: Mercado semanal' : 'Ej: Sueldo Quincena'}
          className="bg-slate-50 border-2 border-slate-200 text-slate-800 text-sm font-bold rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
        />
      </motion.div>

      {/* Calculator Amount */}
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center mt-2 relative focus-within:ring-4 focus-within:ring-indigo-500/50 transition-all shadow-xl"
      >
        <span className="material-symbols-outlined absolute right-4 top-4 text-white/[0.03] text-[120px] pointer-events-none select-none">
          calculate
        </span>
        <span className="font-black text-slate-500 text-[10px] tracking-widest uppercase mb-2">Monto {txType === 'expense' ? 'del Gasto' : 'del Ingreso'}</span>
        <div className="flex items-baseline gap-2 z-10 w-full justify-center">
          <span className={`font-black text-3xl opacity-80 ${txType === 'income' ? 'text-emerald-400' : 'text-slate-300'}`}>$</span>
          <input 
            id="calculator-amount-input"
            type="text" 
            inputMode="decimal"
            value={formatAmountForDisplay(amountStr)}
            onChange={(e) => {
              let raw = e.target.value;
              raw = raw.replace(',', '.');
              const parts = raw.split('.');
              if (parts.length > 2) {
                const integerPart = parts.slice(0, -1).join('');
                const decimalPart = parts[parts.length - 1];
                raw = integerPart + '.' + decimalPart;
              }
              raw = raw.replace(/[^0-9.]/g, '');
              if (raw.startsWith('.')) {
                raw = '0' + raw;
              }
              setAmountStr(raw || '0');
            }}
            placeholder="0"
            className="bg-transparent text-5xl font-black text-white tracking-tighter outline-none w-full max-w-[250px] text-center placeholder:text-slate-700 focus:scale-105 transition-transform"
          />
        </div>
      </motion.div>

      {/* Numpad */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            key={num}
            onClick={() => addDigit(num)}
            className="bg-white border-2 border-slate-200 h-16 rounded-2xl font-black text-2xl text-slate-700 active:bg-slate-100 transition-all flex items-center justify-center shadow-sm"
          >
            {num}
          </motion.button>
        ))}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearDigit}
          className="bg-slate-100 border-2 border-slate-200 h-16 rounded-2xl flex items-center justify-center text-slate-500 active:bg-slate-200 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined font-black text-2xl">backspace</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => addDigit('0')}
          className="bg-white border-2 border-slate-200 h-16 rounded-2xl font-black text-2xl text-slate-700 active:bg-slate-100 transition-all flex items-center justify-center shadow-sm"
        >
          0
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => addDigit('.')}
          className="bg-white border-2 border-slate-200 h-16 rounded-2xl font-black text-2xl text-slate-700 active:bg-slate-100 transition-all flex items-center justify-center shadow-sm pt-2"
        >
          ,
        </motion.button>
      </motion.div>

      <motion.button
        variants={itemVariants}
        whileHover={{ scale: parseFloat(amountStr) > 0 ? 1.02 : 1 }}
        whileTap={{ scale: parseFloat(amountStr) > 0 ? 0.98 : 1 }}
        type="button"
        disabled={parseFloat(amountStr) <= 0}
        onClick={handleSave}
        className={`w-full py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all ${
          parseFloat(amountStr) > 0
            ? 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 shadow-xl'
            : 'bg-slate-100 text-slate-400 border-2 border-slate-200 cursor-not-allowed hidden'
        }`}
      >
        <span className="material-symbols-outlined text-2xl font-bold bg-white/20 p-1 rounded-lg">task_alt</span>
        Guardar Movimiento
      </motion.button>

      <AnimatePresence>
        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 text-center">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl relative"
            >
              <div className="w-20 h-20 bg-emerald-50 border-4 border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                 <span className="material-symbols-outlined font-black text-4xl">check</span>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">¡Movimiento Creado!</h3>
              <p className="text-sm font-semibold text-slate-500 mb-8 px-4">
                El registro se clasificó automáticamente. Sigue controlando tus finanzas.
              </p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSuccess(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition-all shadow-lg"
              >
                Continuar
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
