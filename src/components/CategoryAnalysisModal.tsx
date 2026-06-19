import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CategoryType, Transaction } from '../types';

interface CategoryAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryType | null;
  totalIncome: number;
  totalSpent: number;
  budget: number;
  transactions: Transaction[];
}

export function CategoryAnalysisModal({
  isOpen,
  onClose,
  category,
  totalIncome,
  totalSpent,
  budget,
  transactions
}: CategoryAnalysisModalProps) {
  if (!isOpen || !category) return null;

  const actualPct = totalIncome > 0 ? (totalSpent / totalIncome) * 100 : 0;
  
  let idealPct = 0;
  let categoryName = '';
  let categoryIcon = '';
  let categoryColor = '';

  if (category === '50_NEEDS') {
    idealPct = 50;
    categoryName = 'Básicos / Necesidades';
    categoryIcon = 'home';
    categoryColor = 'text-blue-600 bg-blue-50 border-blue-100';
  } else if (category === '30_WANTS') {
    idealPct = 30;
    categoryName = 'Gustos / Deseos';
    categoryIcon = 'shopping_bag';
    categoryColor = 'text-purple-600 bg-purple-50 border-purple-100';
  } else if (category === '20_SAVINGS') {
    idealPct = 20;
    categoryName = 'Ahorro / Deudas';
    categoryIcon = 'account_balance';
    categoryColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getRecommendation = () => {
    const diff = actualPct - idealPct;
    
    if (category === '20_SAVINGS') {
      if (diff > 5) return '¡Excelente trabajo! Estás ahorrando más de lo recomendado. Sigue así para alcanzar tus metas más rápido.';
      if (diff >= -2 && diff <= 5) return 'Vas por buen camino. Estás muy cerca de la meta de ahorro ideal del 20%.';
      return 'Es momento de enfocarse un poco más en el ahorro. Intenta reducir algunos gustos este mes para aportar más a tu futuro.';
    } else {
      if (diff > 10) return `Cuidado, estás destinando demasiado a ${categoryName.toLowerCase()}. Intenta pausar un poco este tipo de gastos hasta el próximo mes.`;
      if (diff > 0 && diff <= 10) return `Tus gastos en ${categoryName.toLowerCase()} están levemente por encima de lo ideal. Un pequeño ajuste te ayudará a equilibrar.`;
      if (diff > -10 && diff <= 0) return 'Todo se encuentra equilibrado. Manejas muy bien este segmento de tus finanzas.';
      return `¡Muy bien! Estás gastando menos en ${categoryName.toLowerCase()} de lo presupuestado. Ese excedente podrías destinarlo al ahorro.`;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-slate-100">
            <button 
              onClick={onClose}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined block text-xl font-bold">close</span>
            </button>
            <div className="flex items-center gap-4 mb-2">
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${categoryColor}`}>
                 <span className="material-symbols-outlined text-[28px] font-bold">{categoryIcon}</span>
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-800 leading-tight">Análisis</h3>
                  <p className="text-sm font-bold text-slate-400">{categoryName}</p>
               </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto flex flex-col gap-6">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col justify-center">
                 <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">Presupuesto</p>
                 <p className="text-sm font-black text-slate-800">$ {formatCurrency(budget)}</p>
               </div>
               <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex flex-col justify-center">
                 <p className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-400 mb-1">Gasto Real</p>
                 <p className="text-sm font-black text-indigo-700">$ {formatCurrency(totalSpent)}</p>
               </div>
            </div>

            {/* Progress Visualization */}
            <div>
               <div className="flex justify-between items-end mb-2">
                 <p className="text-sm font-extrabold text-slate-800">Porcentaje Actual</p>
                 <p className="text-xl font-black text-slate-800">{actualPct.toFixed(1)}% <span className="text-sm text-slate-400 font-bold">/ {idealPct}%</span></p>
               </div>
               <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(actualPct, 100)}%` }}
                    className={`h-full rounded-full ${actualPct > idealPct ? (category === '20_SAVINGS' ? 'bg-emerald-500' : 'bg-red-500') : 'bg-indigo-500'}`}
                  />
                  {/* Ideal marker line */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                    style={{ left: `${idealPct}%` }}
                  />
               </div>
               <p className="text-[10px] font-bold text-slate-400 text-right mt-1.5 flex justify-end items-center gap-1">
                 <span className="w-2 h-2 rounded-full bg-slate-900 inline-block" /> Marca ideal ({idealPct}%)
               </p>
            </div>

            {/* AI/Heuristic Recommendation */}
            <div className="bg-indigo-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden mt-2">
               <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/30 rounded-full blur-2xl"></div>
               <div className="flex items-start gap-3 relative z-10">
                 <span className="material-symbols-outlined text-indigo-300">psychology</span>
                 <div>
                   <h4 className="text-xs font-black tracking-widest uppercase text-indigo-300 mb-1">Feedback Inteligente</h4>
                   <p className="text-sm font-medium leading-relaxed text-indigo-50">{getRecommendation()}</p>
                 </div>
               </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
