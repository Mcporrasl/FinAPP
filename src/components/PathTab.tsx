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
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text('Extracto Bancario - FinAPP', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    const dateFormatted = new Date().toLocaleString('es-CO', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    doc.text(`Generado el: ${dateFormatted} | Moneda: ${currency}`, 14, 30);

    // Group transactions by YYYY-MM
    type MonthlyData = {
      monthKey: string;
      label: string;
      income: number;
      expenses: number;
      needs: number;
      wants: number;
      savings: number;
      txs: Transaction[];
    };
    
    const monthlySummary: Record<string, MonthlyData> = {};

    [...transactions].forEach(tx => {
      const d = new Date(tx.createdAt || tx.date);
      if (isNaN(d.getTime())) return;
      
      const yStr = d.getFullYear();
      const mStr = String(d.getMonth() + 1).padStart(2, '0');
      const monthKey = `${yStr}-${mStr}`;
      
      if (!monthlySummary[monthKey]) {
        const titleFormatter = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' });
        const monthLabel = titleFormatter.format(d);
        monthlySummary[monthKey] = {
          monthKey,
          label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          income: 0, expenses: 0,
          needs: 0, wants: 0, savings: 0,
          txs: []
        };
      }
      
      const m = monthlySummary[monthKey];
      m.txs.push(tx);
      
      if (tx.type === 'income') {
        m.income += tx.amount;
      } else {
        m.expenses += tx.amount;
        if (tx.category === '50_NEEDS') m.needs += tx.amount;
        if (tx.category === '30_WANTS') m.wants += tx.amount;
        if (tx.category === '20_SAVINGS') m.savings += tx.amount;
      }
    });

    const formatCurr = (val: number) => {
      return new Intl.NumberFormat('es-CO', { style: 'decimal', maximumFractionDigits: 0 }).format(Math.abs(val));
    };

    const sortedMonths = Object.values(monthlySummary).sort((a,b) => a.monthKey.localeCompare(b.monthKey));
    
    let currentY = 40;

    sortedMonths.forEach((m, idx) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      // Month Title
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.text(`Periodo: ${m.label}`, 14, currentY);
      currentY += 8;
      
      // Comparison logic
      let comparisonText = '';
      if (idx > 0) {
        const prev = sortedMonths[idx - 1];
        const prevExp = prev.expenses || 1; // avoid division by zero
        const expGrowth = ((m.expenses - prev.expenses) / prevExp) * 100;
        
        const prevSav = prev.savings || 1;
        const savGrowth = ((m.savings - prev.savings) / prevSav) * 100;
        
        const expLabel = expGrowth > 0 ? `Subieron +${expGrowth.toFixed(1)}% ⚠️` : `Bajaron ${Math.abs(expGrowth).toFixed(1)}% ✅`;
        const savLabel = savGrowth > 0 ? `Subió +${savGrowth.toFixed(1)}% ✅` : `Bajó ${Math.abs(savGrowth).toFixed(1)}% ⚠️`;
        
        comparisonText = `vs Mes Anterior -> Gastos: ${expLabel} | Ahorros: ${savLabel}`;
      } else {
         comparisonText = 'Sin datos previos para comparar.';
      }

      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text(comparisonText, 14, currentY);
      currentY += 8;

      // Summary Table for Month
      autoTable(doc, {
        startY: currentY,
        head: [["Total Ingresos", "Total Gastos", "Básicos (50%)", "Deseos (30%)", "Ahorros (20%)"]],
        body: [[
           `$ ${formatCurr(m.income)}`,
           `$ ${formatCurr(m.expenses)}`,
           `$ ${formatCurr(m.needs)}`,
           `$ ${formatCurr(m.wants)}`,
           `$ ${formatCurr(m.savings)}`
        ]],
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80] },
        styles: { fontSize: 9, halign: 'center' }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;

      // Transactions Table for Month
      m.txs.sort((a,b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      
      const tableRows = m.txs.map(tx => {
        const txDate = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('es-CO') : tx.date;
        const txType = tx.type === 'income' ? 'Ingreso' : 'Gasto';
        const txCat = calculateCatLabel(tx.category);
        const txAmount = `${tx.type === 'income' ? '+' : '-'}$ ${formatCurr(tx.amount)}`;
        return [txDate, txType, txCat, tx.description, txAmount];
      });

      autoTable(doc, {
        startY: currentY,
        head: [["Fecha", "Tipo", "Categoría", "Descripción", "Valor"]],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105], fontSize: 8 },
        styles: { fontSize: 8 },
        columnStyles: {
          4: { halign: 'right', fontStyle: 'bold' }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 20;
    });

    if (sortedMonths.length === 0) {
       doc.text("No hay movimientos registrados para generar el extracto.", 14, 50);
    }
    
    doc.save('FinAPP_Extracto_Bancario.pdf');
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
