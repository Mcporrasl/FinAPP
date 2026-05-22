import React, { useState } from 'react';
import { FamilyData } from '../types';

interface FamilySetupViewProps {
  onFamilyCreated: (family: FamilyData) => void;
  onCancel: () => void;
}

export function FamilySetupView({ onFamilyCreated, onCancel }: FamilySetupViewProps) {
  const [familyName, setFamilyName] = useState('');
  
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) return;

    const newFamily: FamilyData = {
      id: 'family-' + Date.now(),
      name: familyName,
      members: [
        { id: 'm-1', name: 'Yo (Admin)', role: 'admin', avatarUrl: 'https://api.dicebear.com/9.x/micah/svg?seed=Admin&backgroundColor=b6e3f4' },
        { id: 'm-2', name: 'Manuelita', role: 'member', avatarUrl: 'https://api.dicebear.com/9.x/micah/svg?seed=Lily&backgroundColor=ffdfbf' },
        { id: 'm-3', name: 'Papá', role: 'member', avatarUrl: 'https://api.dicebear.com/9.x/micah/svg?seed=Jack&backgroundColor=c0aede' }
      ],
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase()
    };
    
    onFamilyCreated(newFamily);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center animate-fade-in py-10 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-sm w-full shadow-lg text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50">
          <span className="material-symbols-outlined text-[32px]">group</span>
        </div>
        
        <h2 className="text-xl font-extrabold text-slate-800 mb-2">Crear Modo Familiar</h2>
        <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
          Comparte gastos, organiza metas comunes y mejora la administración del hogar junto a tu familia.
        </p>

        <form onSubmit={handleCreate} className="flex flex-col gap-4 text-left">
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
              className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500 font-bold placeholder-slate-400"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-sm transition-all mt-2"
          >
            Crear y Obtener Código
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
