import React from 'react';
import { AvatarOption, SubscriptionTier } from '../types';
import { PiggyLogo } from './PiggyLogo';

interface HeaderProps {
  currentAvatar: AvatarOption;
  isFamilyMode: boolean;
  subscriptionTier: SubscriptionTier;
  onOpenSettings: () => void;
  onOpenSubscription: () => void;
  onOpenCalendar: () => void;
}

export function Header({ currentAvatar, isFamilyMode, onOpenSettings, subscriptionTier, onOpenSubscription, onOpenCalendar }: HeaderProps) {
  const isPro = subscriptionTier !== 'free';

  return (
    <header className="bg-white/95 backdrop-blur-md border-b-2 border-slate-100 sticky top-0 z-40">
      <div className="flex justify-between items-center px-6 py-4 max-w-lg mx-auto w-full">
        {/* Avatar Button */}
        <button 
          id="avatar-btn"
          onClick={onOpenSettings} 
          className="flex items-center gap-2 group cursor-pointer active:scale-95 transition-all outline-none relative"
          title="Configuración"
        >
          <div className="relative w-12 h-12 rounded-full border-4 border-pink-100 p-0.5 overflow-hidden shadow-sm flex items-center justify-center bg-indigo-50 group-hover:scale-105 transition-all">
            {isFamilyMode ? (
              <div className="w-full h-full rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <span className="material-symbols-outlined text-[24px]">group</span>
              </div>
            ) : (
              <div className={`w-full h-full ${currentAvatar.animationClass}`}>
                <img src={currentAvatar.imageUrl} alt={currentAvatar.name} className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </button>

        {/* Title */}
        <div 
          id="app-title"
          onClick={onOpenCalendar}
          className="flex items-center gap-2 select-none cursor-pointer active:scale-98 transition-transform flex-col justify-center"
        >
          <div className="flex items-center gap-2">
            <h1 
              className="font-sans text-2xl font-black tracking-tighter text-slate-900 leading-none flex items-center gap-2"
            >
              FinAPP <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-400">Manuelita</span>
              <div className="ml-1 flex items-center justify-center -mt-1"><PiggyLogo size={36} /></div>
            </h1>
          </div>
          <div className="flex gap-2 items-center mt-1">
            {isPro && (
              <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                <span className="material-symbols-outlined text-[12px]">workspace_premium</span> Pro
              </span>
            )}
            {isFamilyMode && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                Modo Familiar
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Subscription button */}
          <button 
            id="sub-btn"
            onClick={onOpenSubscription}
            title="Premium"
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-95 outline-none shadow-sm ${
              isPro ? 'bg-amber-100 border-2 border-amber-200 text-amber-600 hover:text-amber-700' : 'bg-slate-50 border-2 border-slate-100 text-amber-400 hover:text-amber-500 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[24px] pointer-events-none">workspace_premium</span>
          </button>
          
          {/* Settings button */}
          <button 
            id="settings-btn"
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-2xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:rotate-45 transition-all duration-300 active:scale-95 outline-none shadow-sm"
          >
            <span className="material-symbols-outlined text-[24px] pointer-events-none">settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
