import React from 'react';
import { TabType } from '../types';
import { motion } from 'motion/react';

interface NavBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isFamilyMode: boolean;
  toggleFamilyMode: () => void;
}

export function NavBar({ activeTab, setActiveTab, isFamilyMode, toggleFamilyMode }: NavBarProps) {
  
  const navItems: { id: string; label: string; icon: string }[] = [
    { id: 'home', label: 'Resumen', icon: 'pie_chart' },
    { id: 'goals', label: 'Metas', icon: 'flag' },
    { id: 'add', label: 'Registrar', icon: 'add_circle' },
    { id: 'history', label: 'Historial', icon: 'history' },
    { id: 'family', label: 'Familia', icon: 'group' }
  ];

  return (
    <nav className="fixed bottom-6 z-50 flex justify-around items-end px-3 py-3 bg-white/95 backdrop-blur-md border-2 border-slate-100 shadow-xl shadow-slate-200/50 rounded-3xl max-w-[420px] mx-auto left-1/2 -translate-x-1/2 w-[92%] select-none h-20">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const isAdd = item.id === 'add';
        
        if (isAdd) {
           return (
             <motion.button
               key={item.id}
               id={`nav-btn-${item.id}`}
               onClick={() => {
                 if (activeTab === 'add') {
                   setActiveTab('home');
                 } else {
                   setActiveTab('add');
                 }
               }}
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.9 }}
               className={`relative flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg transition-all cursor-pointer outline-none z-10 -mt-6 mb-1 ${
                 activeTab === 'add' 
                   ? 'bg-slate-800 text-white shadow-slate-800/40 border-b-4 border-slate-900' 
                   : 'bg-emerald-600 text-white shadow-emerald-600/40 hover:bg-emerald-500 border-b-4 border-emerald-700'
               }`}
             >
               <span 
                 className="material-symbols-outlined text-[32px] pointer-events-none"
                 style={{ fontVariationSettings: activeTab === 'add' ? "'FILL' 1, 'wght' 700" : "'FILL' 0, 'wght' 500" }}
               >
                 {activeTab === 'add' ? 'close' : 'add'}
               </span>
             </motion.button>
           );
        }

        if (item.id === 'family') {
          return (
            <motion.button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={toggleFamilyMode}
              whileTap={{ scale: 0.9 }}
              className={`flex flex-col items-center justify-center px-1.5 py-2 rounded-2xl cursor-pointer outline-none mb-1 ${
                isFamilyMode 
                  ? 'bg-emerald-50 text-emerald-700 border-b-4 border-emerald-500 font-black' 
                  : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50 border-b-4 border-transparent'
              }`}
            >
              <motion.span 
                initial={false}
                animate={{ y: isFamilyMode ? -2 : 0 }}
                className="material-symbols-outlined pointer-events-none text-2xl block"
                style={{ fontVariationSettings: isFamilyMode ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 500" }}
              >
                {item.icon}
              </motion.span>
              <span className="text-[10px] font-bold mt-1 pointer-events-none leading-none tracking-wide text-center w-full">
                {item.label}
              </span>
            </motion.button>
          );
        }

        return (
          <motion.button
            key={item.id}
            id={`nav-btn-${item.id}`}
            onClick={() => setActiveTab(item.id as TabType)}
            whileTap={{ scale: 0.9 }}
            className={`flex flex-col items-center justify-center px-1.5 py-2 rounded-2xl cursor-pointer outline-none mb-1 ${
              isActive 
                ? 'bg-emerald-50 text-emerald-700 border-b-4 border-emerald-500 font-black' 
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50 border-b-4 border-transparent'
            }`}
          >
            <motion.span 
              initial={false}
              animate={{ y: isActive ? -2 : 0 }}
              className="material-symbols-outlined pointer-events-none text-2xl block"
              style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 500" }}
            >
              {item.icon}
            </motion.span>
            <span className="text-[10px] font-bold mt-1 pointer-events-none leading-none tracking-wide text-center w-full">
              {item.label}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}
