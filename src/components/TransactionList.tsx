import React, { useState } from 'react';
import { Transaction } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { PiggyLogo } from './PiggyLogo';
import { currencyFormatter } from '../utils/format';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  currency?: string;
}

export function TransactionList({ transactions, onDelete, currency = 'COP' }: TransactionListProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return currencyFormatter.format(val);
  };

  const calculateCatColor = (cat: string) => {
    if (cat === 'INCOME') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (cat === '50_NEEDS') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (cat === '30_WANTS') return 'bg-pink-50 text-pink-700 border-pink-200';
    if (cat === '20_SAVINGS') return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };
  
  const catLabel = (cat: string) => {
    if (cat === 'INCOME') return 'Ingreso Base';
    if (cat === '50_NEEDS') return 'Básicos (50%)';
    if (cat === '30_WANTS') return 'Deséo (30%)';
    if (cat === '20_SAVINGS') return 'Ahorro (20%)';
    return 'General';
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
  };

  return (
    <>
      <div className="flex flex-col gap-4 px-1 text-left">
        <AnimatePresence>
          {transactions.map((tx) => (
            <motion.div 
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
              key={tx.id} 
              className="bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between relative group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 shadow-inner ${calculateCatColor(tx.category)}`}>
                   <span className="material-symbols-outlined text-2xl font-bold">{tx.icon}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-base text-slate-800 line-clamp-1">{tx.description}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-bold text-slate-400">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString('es-CO', { 
                        year: 'numeric', month: 'short', day: 'numeric', 
                        hour: '2-digit', minute: '2-digit' 
                      }) : tx.date}
                    </span>
                    {tx.createdBy && (
                      <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-lg border border-indigo-100">
                        <img src={tx.createdByAvatar || 'https://api.dicebear.com/9.x/micah/svg?seed=Unknown'} alt={tx.createdBy} className="w-4 h-4 rounded-full" />
                        <span>{tx.createdBy}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end mr-10 relative z-0">
                 <span className={`text-base font-black ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                   {tx.type === 'income' ? '+' : '-'} $ {formatCurrency(tx.amount)}
                 </span>
                 <span className={`text-[9px] mt-1 font-black uppercase tracking-wider px-2 py-1 rounded-md border shadow-sm ${calculateCatColor(tx.category)}`}>
                   {catLabel(tx.category)}
                 </span>
              </div>

              {onDelete && (
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setDeleteConfirmId(tx.id)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 hover:border hover:border-red-200 transition-all z-10 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[24px]">delete</span>
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {deleteConfirmId && onDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative flex flex-col items-center justify-center p-8 text-center"
            >
               <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-5 border-4 border-red-100">
                  <span className="material-symbols-outlined text-4xl">warning</span>
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Eliminar Movimiento</h3>
               <p className="text-sm font-semibold text-slate-500 mb-8 leading-relaxed">
                  ¿Estás seguro de que quieres eliminar esta transacción? Esta acción no se puede deshacer.
               </p>
               <div className="flex gap-4 w-full">
                 <motion.button 
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => setDeleteConfirmId(null)}
                   className="flex-1 px-4 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-colors border-2 border-slate-200"
                 >
                   Cancelar
                 </motion.button>
                 <motion.button 
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => {
                     onDelete(deleteConfirmId);
                     setDeleteConfirmId(null);
                   }}
                   className="flex-1 px-4 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black rounded-2xl shadow-lg shadow-red-500/30 border border-red-400"
                 >
                   Eliminar
                 </motion.button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
