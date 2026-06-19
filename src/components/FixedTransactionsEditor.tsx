import React, { useState } from 'react';
import { FixedTransaction, CategoryType } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface FixedTransactionsEditorProps {
  key?: string;
  type: 'income' | 'expense';
  items: FixedTransaction[];
  onChange: (items: FixedTransaction[]) => void;
}

const CAT_LABELS: Record<CategoryType | 'INCOME', string> = {
  INCOME: 'Ingreso Base',
  '50_NEEDS': 'Básicos (Arriendo, Servicios)',
  '30_WANTS': 'Deséo (Suscripciones, Gustos)',
  '20_SAVINGS': 'Ahorro (Inversión)'
};

const DEFAULT_ICONS = ['home', 'payments', 'credit_card', 'electric_bolt', 'water_drop', 'wifi', 'shopping_cart', 'directions_car', 'savings', 'school'];

export function FixedTransactionsEditor({ type, items, onChange }: FixedTransactionsEditorProps) {
  const [desc, setDesc] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<CategoryType | 'INCOME'>(type === 'income' ? 'INCOME' : '50_NEEDS');
  const [icon, setIcon] = useState(type === 'income' ? 'payments' : 'home');

  const handleAdd = () => {
    if (!desc.trim()) return;
    const val = parseInt(amountStr.replace(/\D/g, ''), 10);
    if (!val || val <= 0) return;

    const newItem: FixedTransaction = {
      id: Date.now().toString(),
      type,
      amount: val,
      category,
      description: desc.trim(),
      icon
    };
    onChange([...items, newItem]);
    setDesc('');
    setAmountStr('');
  };

  const handleDelete = (id: string) => {
    onChange(items.filter(i => i.id !== id));
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700/50 flex flex-col gap-3">
        <input 
          type="text" 
          value={desc} 
          onChange={e => setDesc(e.target.value)} 
          placeholder={type === 'income' ? "Ej: Nómina" : "Ej: Arriendo"} 
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 text-sm"
        />
        <input 
          type="text" 
          inputMode="numeric"
          value={amountStr} 
          onChange={e => {
            const cleaned = e.target.value.replace(/\D/g, '');
            setAmountStr(cleaned ? parseInt(cleaned, 10).toLocaleString('es-CO') : '');
          }}
          placeholder="Monto" 
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 text-sm font-bold"
        />
        {type === 'expense' && (
          <select 
            value={category} 
            onChange={e => setCategory(e.target.value as CategoryType)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 text-sm"
          >
            <option value="50_NEEDS">{CAT_LABELS['50_NEEDS']}</option>
            <option value="30_WANTS">{CAT_LABELS['30_WANTS']}</option>
            <option value="20_SAVINGS">{CAT_LABELS['20_SAVINGS']}</option>
          </select>
        )}
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {DEFAULT_ICONS.map(i => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              className={`p-2 rounded-lg flex-shrink-0 border transition-all ${icon === i ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}
            >
              <span className="material-symbols-outlined text-sm">{i}</span>
            </button>
          ))}
        </div>
        <button 
          type="button" 
          onClick={handleAdd}
          disabled={!desc.trim() || !amountStr}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg font-bold text-sm transition-colors mt-1"
        >
          Agregar
        </button>
      </div>

      <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
         <AnimatePresence>
           {items.map(item => (
             <motion.div 
               key={item.id}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex justify-between items-center"
             >
               <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${item.type === 'income' ? 'bg-emerald-900 text-emerald-400' : 'bg-rose-900 text-rose-400'}`}>
                   <span className="material-symbols-outlined text-lg">{item.icon}</span>
                 </div>
                 <div className="flex flex-col text-left">
                   <span className="text-white font-bold text-sm leading-tight">{item.description}</span>
                   <span className="text-slate-400 text-[10px] uppercase font-bold">{CAT_LABELS[item.category as keyof typeof CAT_LABELS]}</span>
                 </div>
               </div>
               <div className="flex items-center gap-4">
                 <span className={`font-bold text-sm ${item.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                   ${item.amount.toLocaleString('es-CO')}
                 </span>
                 <button onClick={() => handleDelete(item.id)} className="text-rose-400 hover:text-rose-300 p-1">
                   <span className="material-symbols-outlined text-lg">delete</span>
                 </button>
               </div>
             </motion.div>
           ))}
           {items.length === 0 && (
             <div className="text-center py-6 text-slate-500 text-sm font-bold border-2 border-dashed border-slate-700 rounded-xl">
               No hay elementos agregados.
             </div>
           )}
         </AnimatePresence>
      </div>
    </div>
  );
}
