import React, { useState } from 'react';
import { Transaction } from '../types';

interface OnboardingWizardProps {
  userName: string;
  onComplete: (initialTxs: Omit<Transaction, 'id' | 'date'>[]) => void;
}

export function OnboardingWizard({ userName, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [incomeStr, setIncomeStr] = useState('');
  const [needsStr, setNeedsStr] = useState('');

  const handleFinish = () => {
    const txs: Omit<Transaction, 'id' | 'date'>[] = [];
    const incomeVal = parseFloat(incomeStr.replace(/\D/g, ''));
    if (!isNaN(incomeVal) && incomeVal > 0) {
      txs.push({
        type: 'income',
        amount: incomeVal,
        category: 'INCOME',
        description: 'Ingreso Inicial',
        icon: 'account_balance_wallet'
      });
    }

    const needsVal = parseFloat(needsStr.replace(/\D/g, ''));
    if (!isNaN(needsVal) && needsVal > 0) {
      txs.push({
        type: 'expense',
        amount: needsVal,
        category: '50_NEEDS',
        description: 'Gastos Fijos Base',
        icon: 'home'
      });
    }

    onComplete(txs);
  };

  const steps = [
    {
      icon: 'waving_hand',
      title: `¡Hola, ${userName}!`,
      content: 'Bienvenido a un espacio seguro para tus finanzas. Aquí no hay juicios, solo progreso. Vamos a empezar de cero paso a paso.'
    },
    {
      icon: 'pie_chart',
      title: 'La Regla Flexible',
      content: 'Seguro escuchaste del 50/30/20 (50% básicos, 30% gustos, 20% ahorro). Es ideal, pero sabemos que la vida real no es exacta.'
    },
    {
      icon: 'monitoring',
      title: 'Nos Adaptamos a Ti',
      content: 'FinAPP recalculará dinámicamente tus porcentajes reales frente a los ideales. Así aprenderás a conocer tus propios límites sin agobiarte.'
    },
    {
      icon: 'payments',
      title: 'Tus Ingresos',
      content: '¿Cuál es tu ingreso mensual aproximado? (No te preocupes, puedes agregar más adelante)',
      input: true,
      value: incomeStr,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '');
        const formatted = val ? new Intl.NumberFormat('es-CO').format(parseInt(val, 10)) : '';
        setIncomeStr(formatted);
      },
      placeholder: 'Ej: 2.000.000'
    },
    {
      icon: 'home',
      title: 'Tus Gastos Fijos',
      content: '¿A cuánto ascienden tus gastos fijos (arriendo, servicios, mercado)?',
      input: true,
      value: needsStr,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '');
        const formatted = val ? new Intl.NumberFormat('es-CO').format(parseInt(val, 10)) : '';
        setNeedsStr(formatted);
      },
      placeholder: 'Ej: 1.000.000'
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center selection:bg-indigo-500">
      <div className="w-full max-w-sm flex flex-col items-center animate-fade-in relative z-10 bg-slate-900 border border-slate-700/50 p-8 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl rotate-3 flex items-center justify-center shadow-2xl mb-6 transform transition-transform animate-scale-up relative z-10">
           <span className="material-symbols-outlined text-4xl">{currentStep.icon}</span>
        </div>

        <h2 className="text-2xl font-extrabold text-white mb-3 tracking-tight drop-shadow-sm relative z-10">
          {currentStep.title}
        </h2>
        
        <p className="text-indigo-100/80 text-sm font-medium leading-relaxed mb-8 max-w-[280px] relative z-10">
          {currentStep.content}
        </p>

        {currentStep.input && (
          <div className="w-full mb-8 relative z-10">
            <input
              type="text"
              inputMode="numeric"
              value={currentStep.value}
              onChange={currentStep.onChange}
              placeholder={currentStep.placeholder}
              className="w-full bg-slate-800/50 border border-slate-600 text-white placeholder:text-slate-500 rounded-xl px-4 py-3 text-center text-lg font-bold focus:outline-none focus:border-indigo-500 focus:bg-slate-800 transition-colors"
            />
          </div>
        )}

        {/* Progress indicators */}
        <div className="flex gap-2 mb-8 relative z-10">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 === step ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-700'
              }`}
            />
          ))}
        </div>

        <button 
          onClick={() => {
            if (step < steps.length) {
              setStep(s => s + 1);
            } else {
              handleFinish();
            }
          }}
          className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-base py-3.5 rounded-xl shadow-lg transition-all active:scale-95 relative z-10"
        >
          {step < steps.length ? 'Continuar' : 'Comenzar mi Proceso'}
        </button>
      </div>
    </div>
  );
}
