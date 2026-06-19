import React, { useState } from 'react';
import { Transaction, FixedTransaction } from '../types';
import { FixedTransactionsEditor } from './FixedTransactionsEditor';

interface OnboardingWizardProps {
  userName: string;
  onComplete: (fixedItems: FixedTransaction[]) => void;
}

export function OnboardingWizard({ userName, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [incomes, setIncomes] = useState<FixedTransaction[]>([]);
  const [expenses, setExpenses] = useState<FixedTransaction[]>([]);

  const handleFinish = () => {
    onComplete([...incomes, ...expenses]);
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
      content: 'FinAPP se basa en la regla 50/30/20 (50% básicos, 30% gustos, 20% ahorro), pero se adaptará a tu realidad mensual automáticamente.'
    },
    {
      icon: 'payments',
      title: 'Tus Ingresos Fijos',
      content: 'Agrega tu salario u otros ingresos recurrentes. Se registrarán automáticamente cada mes.',
      custom: true,
      component: <FixedTransactionsEditor type="income" items={incomes} onChange={setIncomes} />
    },
    {
      icon: 'home',
      title: 'Tus Gastos Fijos',
      content: 'Añade arriendo, servicios, cuotas fijas (se registran mes a mes).',
      custom: true,
      component: <FixedTransactionsEditor type="expense" items={expenses} onChange={setExpenses} />
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center selection:bg-indigo-500 overflow-y-auto w-full">
      <div className="w-full max-w-sm flex flex-col items-center animate-fade-in relative z-10 bg-slate-900 border border-slate-700/50 p-6 sm:p-8 rounded-3xl shadow-2xl overflow-hidden my-auto">
        
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>

        {!currentStep.custom && (
          <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl rotate-3 flex items-center justify-center shadow-2xl mb-6 transform transition-transform animate-scale-up relative z-10 mx-auto">
             <span className="material-symbols-outlined text-4xl">{currentStep.icon}</span>
          </div>
        )}

        <h2 className={`text-2xl font-extrabold text-white tracking-tight drop-shadow-sm relative z-10 ${currentStep.custom ? 'mb-2 text-xl' : 'mb-3'}`}>
          {currentStep.title}
        </h2>
        
        <p className={`text-indigo-100/80 font-medium leading-relaxed drop-shadow-sm relative z-10 ${currentStep.custom ? 'text-xs mb-4' : 'text-sm mb-8 max-w-[280px]'}`}>
          {currentStep.content}
        </p>

        {currentStep.custom && (
          <div className="w-full relative z-10 mb-6 text-left">
            {currentStep.component}
          </div>
        )}

        {/* Progress indicators */}
        <div className="flex gap-2 mb-8 relative z-10 w-full justify-center">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 === step ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-4 w-full relative z-10 mt-auto">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="flex-1 border-2 border-slate-700 text-slate-300 font-bold py-3.5 rounded-2xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Atrás
            </button>
          )}
          <button 
            onClick={() => {
              if (step < steps.length) {
                setStep(s => s + 1);
              } else {
                handleFinish();
              }
            }}
            className="flex-[2] bg-indigo-600 hover:bg-indigo-400 text-white font-extrabold text-base py-3.5 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            {step < steps.length ? 'Continuar' : 'Comenzar mi Proceso'}
          </button>
        </div>
      </div>
    </div>
  );
}
