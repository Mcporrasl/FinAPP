import React, { useState, useMemo } from 'react';
import { Transaction, CategoryType } from '../types';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  Cell,
  ReferenceLine 
} from 'recharts';

interface MonthlyReportProps {
  transactions: Transaction[];
  currency?: string;
}

export function MonthlyReport({ transactions, currency = 'COP' }: MonthlyReportProps) {
  // Helper to extract a real date from transaction
  const getTxDate = (tx: Transaction): Date => {
    if (tx.createdAt) {
      const d = new Date(tx.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    const parsedDate = new Date(tx.date);
    if (!isNaN(parsedDate.getTime())) return parsedDate;
    return new Date(); // Fallback to current date
  };

  // Extract all available months/years from transactions
  const monthOptions = useMemo(() => {
    const monthsMap = new Map<string, string>();
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    transactions.forEach(tx => {
      const date = getTxDate(tx);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const label = `${monthNames[month]} ${year}`;
      monthsMap.set(key, label);
    });

    // If empty, add current month
    if (monthsMap.size === 0) {
      const now = new Date();
      const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
      monthsMap.set(key, label);
    }

    // Sort descending chronologically
    return Array.from(monthsMap.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [transactions]);

  // Set selected month to the latest available one
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return monthOptions[0]?.key || '';
  });

  // Filter transactions for selected month
  const filteredTransactions = useMemo(() => {
    if (selectedMonth === 'ALL') return transactions;
    return transactions.filter(tx => {
      const date = getTxDate(tx);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  // Calculations for current selection
  const reportTotals = useMemo(() => {
    let income = 0;
    let needs = 0;
    let wants = 0;
    let savings = 0;

    filteredTransactions.forEach(tx => {
      if (tx.type === 'income') {
        income += tx.amount;
      } else {
        if (tx.category === '50_NEEDS') needs += tx.amount;
        else if (tx.category === '30_WANTS') wants += tx.amount;
        else if (tx.category === '20_SAVINGS') savings += tx.amount;
      }
    });

    const totalExpense = needs + wants + savings;
    const balance = income - totalExpense;

    return {
      income,
      needs,
      wants,
      savings,
      totalExpense,
      balance
    };
  }, [filteredTransactions]);

  const formatValue = (value: number) => {
    return `${currency === 'COP' ? '$' : currency} ${new Intl.NumberFormat('es-CO', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(value)}`;
  };

  // Data for Chart 1: Side-by-Side General Income vs Expense Comparison
  const generalComparisonData = [
    {
      name: 'Flujo de Dinero',
      'Ingresos': reportTotals.income,
      'Gastos': reportTotals.totalExpense
    }
  ];

  // Data for Chart 2: Category Distribution Breakdown with percentage targets (aligned with 50/30/20)
  const categoryDistributionData = [
    {
      category: 'Básicos (50%)',
      actual: reportTotals.needs,
      ideal: reportTotals.income * 0.5,
      rawPct: reportTotals.income > 0 ? (reportTotals.needs / reportTotals.income) * 100 : 0,
      targetPct: 50,
      color: '#3b82f6', // blue-500
    },
    {
      category: 'Deseos (30%)',
      actual: reportTotals.wants,
      ideal: reportTotals.income * 0.3,
      rawPct: reportTotals.income > 0 ? (reportTotals.wants / reportTotals.income) * 100 : 0,
      targetPct: 30,
      color: '#f43f5e', // pink-500
    },
    {
      category: 'Ahorro (20%)',
      actual: reportTotals.savings,
      ideal: reportTotals.income * 0.2,
      rawPct: reportTotals.income > 0 ? (reportTotals.savings / reportTotals.income) * 100 : 0,
      targetPct: 20,
      color: '#10b981', // emerald-500
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-700 shadow-xl text-xs font-semibold leading-relaxed">
          <p className="font-extrabold text-slate-300 border-b border-slate-700 pb-1 mb-1.5">{payload[0].payload.category || payload[0].name}</p>
          {payload.map((item: any, idx: number) => (
            <p key={idx} style={{ color: item.color || item.fill }}>
              {item.name}: {formatValue(item.value)}
              {item.payload.rawPct !== undefined && ` (${item.payload.rawPct.toFixed(1)}%)`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-5 text-left mb-6">
      
      {/* Header of Report Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600 bg-indigo-50 p-1 rounded-lg">equalizer</span>
            Reporte Mensual Interactivo
          </h4>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Analiza el cumplimiento de tus límites financieros 50/30/20.</p>
        </div>
        
        {/* Month Dropdown filter */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 self-start sm:self-auto">
          <span className="material-symbols-outlined text-slate-400 text-sm">calendar_month</span>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">Historial Completo</option>
            {monthOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Numerical Insights */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800/80">Ingreso total</span>
          <p className="text-[13px] sm:text-base font-black text-emerald-700 mt-1">{formatValue(reportTotals.income)}</p>
        </div>
        <div className="bg-pink-50/60 border border-pink-100 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase tracking-wider text-pink-800/80">Gasto total</span>
          <p className="text-[13px] sm:text-base font-black text-pink-700 mt-1">{formatValue(reportTotals.totalExpense)}</p>
        </div>
        <div className={`border p-3 rounded-2xl flex flex-col justify-between ${reportTotals.balance >= 0 ? 'bg-indigo-50/50 border-indigo-100 text-indigo-700' : 'bg-red-50/50 border-red-100 text-red-700'}`}>
          <span className="text-[9px] font-black uppercase tracking-wider opacity-85">Balance neto</span>
          <p className="text-[13px] sm:text-base font-black mt-1">
            {reportTotals.balance >= 0 ? '+' : ''} {formatValue(reportTotals.balance)}
          </p>
        </div>
      </div>

      {/* Main double chart section */}
      <div className="flex flex-col gap-6 mt-2">
        
        {/* Chart 1: Income vs Spending Bar Chart */}
        <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5 select-none">
            <span className="material-symbols-outlined text-[15px] text-slate-400">compare_arrows</span>
            Comparativa: Ingresos vs Egresos
          </h5>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={generalComparisonData}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                barSize={48}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(v) => currency === 'COP' ? `$${v/1000}k` : `${currency}${v}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                <Bar dataKey="Ingresos" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Gastos" fill="#f43f5e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category distribution and targets comparing directly actual vs ideal budget */}
        <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5 select-none">
            <span className="material-symbols-outlined text-[15px] text-slate-400">pie_chart</span>
            Uso del Presupuesto por Categoría (Vs Ideal)
          </h5>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryDistributionData}
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                layout="horizontal"
                barGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(v) => currency === 'COP' ? `$${v/1000}k` : `${currency}${v}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(226, 232, 240, 0.3)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                
                {/* Visualizing Actual usage bar */}
                <Bar name="Monto Real" dataKey="actual" radius={[6, 6, 0, 0]}>
                  {categoryDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                
                {/* Visualizing Recommended/Ideal Limit based on 50/30/20 proportions */}
                <Bar name="Límite Recomendado" dataKey="ideal" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Instructive/AI Advisory Note */}
        {reportTotals.income > 0 && (
          <div className="bg-indigo-50/30 border border-indigo-100 rounded-2xl p-4 flex gap-3.5 items-start">
            <span className="material-symbols-outlined text-indigo-600 bg-indigo-50 p-2 rounded-xl text-xl font-bold flex-shrink-0">tips_and_updates</span>
            <div className="flex flex-col gap-1">
              <strong className="text-xs text-indigo-950 font-black">Recomendación para {selectedMonth === 'ALL' ? 'todo tu Historial' : monthOptions.find(o => o.key === selectedMonth)?.label}:</strong>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                {reportTotals.needs > reportTotals.income * 0.5 ? (
                  'Tus gastos básicos superan el 50% recomendado. Intenta renegociar servicios públicos, reducir compras fijas o consolidar deudas para recuperar el balance.'
                ) : reportTotals.wants > reportTotals.income * 0.3 ? (
                  'Tus gastos en deseos (ocio, restaurantes, compras) superan el 30%. Considera postergar compras no esenciales el próximo mes para cumplir tus metas de ahorro.'
                ) : (
                  '¡Excelente trabajo! Cumples perfectamente los límites de tu regla de oro familiar. Mantén este ritmo positivo para potenciar tus metas de ahorro e inversión futura.'
                )}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
