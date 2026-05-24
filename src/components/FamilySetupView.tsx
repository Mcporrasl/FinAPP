import React, { useState } from 'react';
import { FamilyData } from '../types';

interface FamilySetupViewProps {
  onFamilyCreated: (family: FamilyData) => void;
  onFamilyJoined: (inviteCode: string) => void;
  onCancel: () => void;
  isPro?: boolean;
}

export function FamilySetupView({ onFamilyCreated, onFamilyJoined, onCancel, isPro = false }: FamilySetupViewProps) {
  const [mode, setMode] = useState<'create' | 'join'>(isPro ? 'create' : 'join');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create') {
      if (!familyName.trim()) return;
      const newFamily: FamilyData = {
        id: 'family-' + Date.now(),
        name: familyName,
        members: [
          { id: 'm-1', name: 'Yo (Admin)', role: 'admin', avatarUrl: 'https://api.dicebear.com/9.x/micah/svg?seed=Admin&backgroundColor=b6e3f4' }
        ],
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase()
      };
      onFamilyCreated(newFamily);
    } else {
      if (!inviteCode.trim()) return;
      onFamilyJoined(inviteCode.trim().toUpperCase());
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center animate-fade-in py-10 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-sm w-full shadow-lg text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50">
          <span className="material-symbols-outlined text-[32px]">group</span>
        </div>
        
        <h2 className="text-xl font-extrabold text-slate-800 mb-2">Modo Familiar</h2>
        <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
          Comparte gastos, organiza metas comunes y mejora la administración del hogar junto a tu familia.
        </p>

        {isPro ? (
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'create' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Crear Familia
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'join' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Unirse con Código
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-lg text-[10px] sm:text-xs font-bold text-center mb-6">
            <span className="material-symbols-outlined align-middle mr-1 text-[16px]">info</span>
            Eres usuario Free. Pásate a Pro para Crear una familia, o Ingresa un Código para unirte a una.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          {mode === 'create' ? (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Nombre de tu Familia
              </label>
              <input 
                type="text" 
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="Ej: Familia Pérez"
                maxLength={30}
                className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 font-bold placeholder-slate-400"
                required
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Código de Invitación
              </label>
              <input 
                type="text" 
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Ej: A1B2C3"
                maxLength={10}
                className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 font-bold placeholder-slate-400 uppercase text-center tracking-widest"
                required
              />
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-sm transition-all mt-2"
          >
            {mode === 'create' ? 'Crear y Obtener Código' : 'Unirse a la Familia'}
          </button>
          
          <button 
            type="button"
            onClick={onCancel}
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-3 rounded-xl border border-slate-200 transition-all text-xs"
          >
            Volver al Modo Personal
          </button>
        </form>
      </div>
    </div>
  );
}
