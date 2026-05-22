import React from 'react';
import { AvatarOption, AVATAR_OPTIONS } from '../types';

interface SettingsModalProps {
  currentName: string;
  currentAvatar: AvatarOption;
  currentCurrency: string;
  onSave: (name: string, avatar: AvatarOption, currency: string) => void;
  onClose: () => void;
  onLogout: () => void;
}

export function SettingsModal({
  currentName,
  currentAvatar,
  currentCurrency,
  onSave,
  onClose,
  onLogout,
}: SettingsModalProps) {
  const [name, setName] = React.useState(currentName);
  const [selectedAvatar, setSelectedAvatar] = React.useState<AvatarOption>(currentAvatar);
  const [currency, setCurrency] = React.useState(currentCurrency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name, selectedAvatar, currency);
  };

  return (
    <div id="settings-modal" className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative max-w-sm w-full animate-scale-up text-left">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-50 transition-colors border border-slate-200 cursor-pointer"
        >
          <span className="material-symbols-outlined block text-base font-bold">close</span>
        </button>

        {/* Header Title */}
        <h3 className="text-lg font-extrabold text-slate-800 mb-5 flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-indigo-600 font-bold">manage_accounts</span>
          Ajustes de Perfil
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Avatar Options */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Estado de Ánimo</label>
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedAvatar(opt)}
                  className={`relative flex items-center justify-center w-14 h-14 p-2 rounded-xl border transition-all duration-150 outline-none cursor-pointer ${
                    selectedAvatar.id === opt.id 
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50 scale-105' 
                      : 'border-slate-200 bg-slate-50 opacity-60 hover:opacity-100 hover:bg-slate-100'
                  }`}
                  title={opt.name}
                >
                  <div className={`w-full h-full ${opt.animationClass}`}>
                    <img src={opt.imageUrl} alt={opt.name} className="w-full h-full object-cover rounded-full" />
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-center text-slate-400 font-bold mt-2">
              Estado seleccionado: <span className="underline font-bold text-slate-700">{selectedAvatar.name}</span>
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Laura Pérez"
              maxLength={20}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 font-bold placeholder-slate-400"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Moneda Base</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-lg px-3 py-2.5 outline-none cursor-pointer focus:border-indigo-500"
            >
              <option value="COP">COP (Pesos Colombianos 🇨🇴)</option>
              <option value="USD">USD (Dólares 💵)</option>
              <option value="EUR">EUR (Euros 💶)</option>
              <option value="MXN">MXN (Pesos Mexicanos 🇲🇽)</option>
            </select>
          </div>

          <div className="flex gap-2 w-full mt-2">
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-3 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Salir
            </button>
            <button
              type="submit"
              className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-sm"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
