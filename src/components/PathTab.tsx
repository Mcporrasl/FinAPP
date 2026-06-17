import React from 'react';
import { Transaction } from '../types';
import { motion } from 'motion/react';
import { PiggyLogo } from './PiggyLogo';
import { TransactionList } from './TransactionList';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PathTabProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  currency?: string;
}

export function PathTab({ transactions, onDeleteTransaction, currency = 'COP' }: PathTabProps) {
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

  const calculateCatLabel = (cat: string) => {
    if (cat === 'INCOME') return 'Ingreso';
    if (cat === '50_NEEDS') return 'Básicos (50%)';
    if (cat === '30_WANTS') return 'Deseos (30%)';
    if (cat === '20_SAVINGS') return 'Ahorro (20%)';
    return 'General';
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header text
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('Historial de Movimientos - FinAPP', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    const dateFormatted = new Date().toLocaleString('es-CO', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    doc.text(`Generado el: ${dateFormatted}`, 14, 30);
    
    const tableColumn = ["Fecha", "Tipo", "Categoría", "Descripción", "Valor"];
    const tableRows: any[] = [];
    
    const sortedTransactions = [...transactions].sort((a,b) => {
      const aDate = new Date(a.createdAt || a.date).getTime();
      const bDate = new Date(b.createdAt || b.date).getTime();
      return bDate - aDate;
    });

    sortedTransactions.forEach(tx => {
      const txDate = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('es-CO') : tx.date;
      const txType = tx.type === 'income' ? 'Ingreso' : 'Gasto';
      const txCat = calculateCatLabel(tx.category);
      const valStr = new Intl.NumberFormat('es-CO', { style: 'decimal', maximumFractionDigits: 0 }).format(tx.amount);
      const txAmount = `${tx.type === 'income' ? '+' : '-'}${currency === 'COP' ? '$' : currency} ${valStr}`;
      
      tableRows.push([txDate, txType, txCat, tx.description, txAmount]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        4: { halign: 'right', fontStyle: 'bold' } // Value column
      }
    });
    
    doc.save('FinAPP_Historial.pdf');
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
      className="pb-32 flex flex-col gap-5 w-full text-left"
    >
      
      <div className="text-center mt-2 mb-2 relative">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">
          Historial de Movimientos
        </h3>
        <p className="text-slate-500 font-semibold text-sm mt-1">Controla tus gastos y elimina errores</p>
        
        {transactions.length > 0 && (
          <button 
            onClick={handleExportPDF}
            className="mx-auto mt-4 flex items-center justify-center gap-2 bg-slate-800 text-white font-bold py-2 px-5 rounded-xl text-sm border border-slate-700 shadow hover:bg-slate-700 hover:shadow-md transition-all sm:absolute sm:top-0 sm:right-4 sm:mt-0"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            Exportar PDF
          </button>
        )}
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
