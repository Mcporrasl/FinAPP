import React from 'react';
import { Transaction } from '../types';
import { motion } from 'motion/react';
import { PiggyLogo } from './PiggyLogo';
import { TransactionList } from './TransactionList';

interface PathTabProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  currency?: string;
}

export function PathTab({ transactions, onDeleteTransaction, currency }: PathTabProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
      className="pb-32 flex flex-col gap-5 w-full text-left"
    >
      
      <div className="text-center mt-2 mb-2">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">
          Historial de Movimientos
        </h3>
        <p className="text-slate-500 font-semibold text-sm mt-1">Controla tus gastos y elimina errores</p>
      </div>

      <div className="w-full flex justify-between bg-white px-4 py-3 border-b-2 border-slate-100 mb-2 select-none text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10">
         <span>Fecha / Movimiento</span>
         <span>Categoría / Valor</span>
      </div>

      <TransactionList 
        transactions={transactions}
        onDelete={onDeleteTransaction}
        currency={currency}
      />
        
      {transactions.length === 0 && (
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-6 opacity-80">
            <PiggyLogo size={120} />
          </div>
          <p className="text-xl font-black text-slate-800 mb-2">Aún no hay movimientos</p>
          <p className="text-sm font-semibold text-slate-500 max-w-[250px]">Registra tu primer ingreso o gasto tocando el botón + abajo.</p>
        </motion.div>
      )}

    </motion.div>
  );
}
