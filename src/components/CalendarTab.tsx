import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { TransactionList } from './TransactionList';

interface CalendarTabProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  currency: string;
}

export function CalendarTab({ transactions, onDeleteTransaction, currency }: CalendarTabProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDate(null);
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const parseTxDate = (tx: Transaction): Date => {
    if (tx.createdAt) {
      const d = new Date(tx.createdAt);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    const today = new Date();
    today.setHours(0,0,0,0);
    if (tx.date === 'Hace 1 día') {
      today.setDate(today.getDate() - 1);
    } else if (tx.date === 'Hace 2 días') {
      today.setDate(today.getDate() - 2);
    } else if (tx.date === 'Hace 3 días') {
      today.setDate(today.getDate() - 3);
    } else if (tx.date !== 'Hoy') {
       // fallback for unexpected strings
    }
    return today;
  };

  const transactionsWithParsedDate = useMemo(() => {
    return transactions.map(tx => ({
      ...tx,
      parsedDate: parseTxDate(tx)
    }));
  }, [transactions]);

  const hasTransactions = (day: number) => {
    const checkDate = new Date(currentYear, currentMonth, day).getTime();
    return transactionsWithParsedDate.some(tx => tx.parsedDate.getTime() === checkDate);
  };

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(currentYear, currentMonth, day));
  };

  const selectedDateTransactions = useMemo(() => {
    if (!selectedDate) return [];
    return transactionsWithParsedDate.filter(
      tx => tx.parsedDate.getTime() === selectedDate.getTime()
    );
  }, [transactionsWithParsedDate, selectedDate]);

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-indigo-500">calendar_month</span>
          Calendario Pro
        </h2>
        
        <div className="flex justify-between items-center mb-4">
          <button onClick={prevMonth} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600">
            <span className="material-symbols-outlined font-bold">chevron_left</span>
          </button>
          <div className="font-bold text-lg text-slate-700 capitalize">
            {monthNames[currentMonth]} {currentYear}
          </div>
          <button onClick={nextMonth} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600">
            <span className="material-symbols-outlined font-bold">chevron_right</span>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
           {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dayName => (
             <div key={dayName} className="text-[10px] font-bold text-slate-400 uppercase">
               {dayName}
             </div>
           ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10"></div>
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
             const day = i + 1;
             const dateVal = new Date(currentYear, currentMonth, day).getTime();
             const isSelected = selectedDate && selectedDate.getTime() === dateVal;
             const hasTx = hasTransactions(day);
             
             return (
               <button 
                 key={day}
                 onClick={() => handleDayClick(day)}
                 className={`h-10 rounded-xl flex items-center justify-center font-medium transition-all relative ${
                    isSelected 
                      ? 'bg-indigo-500 text-white shadow-md' 
                      : 'hover:bg-slate-50 text-slate-700'
                 }`}
               >
                 {day}
                 {hasTx && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-400"></span>
                 )}
                 {hasTx && isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-200"></span>
                 )}
               </button>
             )
          })}
        </div>
      </div>
      
      {selectedDate && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
            Movimientos del {selectedDate.getDate()} {monthNames[selectedDate.getMonth()].slice(0,3)}
            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
              {selectedDateTransactions.length} items
            </span>
          </h3>
          
          {selectedDateTransactions.length > 0 ? (
            <TransactionList 
              transactions={selectedDateTransactions}
              onDelete={onDeleteTransaction}
              currency={currency}
            />
          ) : (
             <div className="text-center py-8 text-slate-400 text-sm">
               No hay movimientos en esta fecha.
             </div>
          )}
        </div>
      )}
    </div>
  );
}
