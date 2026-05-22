import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { NavBar } from './components/NavBar';
import { HomeTab } from './components/HomeTab';
import { AddTab } from './components/AddTab';
import { DreamsTab } from './components/DreamsTab'; // Acts as GoalsTab
import { PathTab } from './components/PathTab';     // Acts as HistoryTab
import { SettingsModal } from './components/SettingsModal';
import { FamilySetupView } from './components/FamilySetupView';
import { AuthView } from './components/AuthView';
import { OnboardingWizard } from './components/OnboardingWizard';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { 
  TabType, 
  AvatarOption, 
  Transaction, 
  Goal,
  AVATAR_OPTIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_GOALS,
  FamilyData,
  CategoryType
} from './types';

// Simple confetti element for celebration
function createStar(container: HTMLElement) {
  const star = document.createElement('div');
  star.classList.add('confetti-star');
  star.innerHTML = '💸';

  const size = Math.random() * 15 + 10;
  star.style.width = `${size}px`;
  star.style.height = `${size}px`;
  star.style.left = `${Math.random() * 100}%`;
  star.style.top = '-20px';
  star.style.animationDuration = `${Math.random() * 2 + 2}s`;
  star.style.animationName = 'fallAndSpin';
  
  container.appendChild(star);
  setTimeout(() => {
    if (container.contains(star)) {
      container.removeChild(star);
    }
  }, 4000);
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  // --- Persistent State Variables ---
  const [userName, setUserName] = useState<string>('Usuario');
  
  const [activeAvatar, setActiveAvatar] = useState<AvatarOption>(AVATAR_OPTIONS[0]);

  const [currency, setCurrency] = useState<string>('COP');

  // Currently utilizing localStorage for app state to remain offline-compatible.
  // Full Firestore syncing of transactions/goals can be implemented by attaching onSnapshot to `db`.
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('fin_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_TRANSACTIONS;
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('fin_goals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_GOALS;
      }
    }
    return INITIAL_GOALS;
  });

  // --- Main Application State ---
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showRewardNotification, setShowRewardNotification] = useState(false);
  const [rewardMessage, setRewardMessage] = useState('');

  // --- Auth & Onboarding State ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('fin_onboarded') === 'true';
  });

  // --- Family State Variables ---
  const [isFamilyMode, setIsFamilyMode] = useState<boolean>(() => {
    return localStorage.getItem('fin_family_mode') === 'true';
  });

  const [familyData, setFamilyData] = useState<FamilyData | null>(() => {
    const saved = localStorage.getItem('fin_family_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [familyTransactions, setFamilyTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('fin_family_tx');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [familyGoals, setFamilyGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('fin_family_goals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthenticated(!!user);
      if (user) {
        setUserName(user.displayName || 'Usuario');
        // Setup initial user profile in Firestore if it doesn't exist
        const userRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              name: user.displayName || 'Usuario',
              currency: 'COP',
              activeAvatarId: AVATAR_OPTIONS[0].id,
              isFamilyMode: false,
              hasCompletedOnboarding: false,
              createdAt: new Date().toISOString()
            });
          } else {
            const data = userSnap.data();
            setUserName(data.name || user.displayName || 'Usuario');
            setCurrency(data.currency || 'COP');
            const matchingAvatar = AVATAR_OPTIONS.find(a => a.id === data.activeAvatarId);
            if (matchingAvatar) setActiveAvatar(matchingAvatar);
            if (data.isFamilyMode !== undefined) setIsFamilyMode(data.isFamilyMode);
            if (data.hasCompletedOnboarding !== undefined) {
              setHasCompletedOnboarding(data.hasCompletedOnboarding);
              localStorage.setItem('fin_onboarded', String(data.hasCompletedOnboarding));
            }
          }
          setIsProfileLoaded(true);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setIsProfileLoaded(false);
      }
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync state to local storage and optionally Firestore
  useEffect(() => {
    if (!isAuthChecking) {
      localStorage.setItem('fin_user_name', userName);
      localStorage.setItem('fin_active_avatar', JSON.stringify(activeAvatar));
      localStorage.setItem('fin_currency', currency);
      localStorage.setItem('fin_transactions', JSON.stringify(transactions));
      localStorage.setItem('fin_goals', JSON.stringify(goals));
      localStorage.setItem('fin_family_mode', String(isFamilyMode));
      if (familyData) localStorage.setItem('fin_family_data', JSON.stringify(familyData));
      localStorage.setItem('fin_family_tx', JSON.stringify(familyTransactions));
      localStorage.setItem('fin_family_goals', JSON.stringify(familyGoals));
    }
  }, [userName, activeAvatar, currency, transactions, goals, isFamilyMode, familyData, familyTransactions, familyGoals, isAuthChecking]);

  // Sync profile changes to Firestore
  useEffect(() => {
    if (currentUser && !isAuthChecking && isProfileLoaded) {
      const userRef = doc(db, 'users', currentUser.uid);
      setDoc(userRef, {
        name: userName,
        currency: currency,
        activeAvatarId: activeAvatar.id,
        isFamilyMode: isFamilyMode,
        hasCompletedOnboarding: hasCompletedOnboarding
      }, { merge: true }).catch(console.error);
    }
  }, [userName, currency, activeAvatar, isFamilyMode, hasCompletedOnboarding, currentUser, isAuthChecking, isProfileLoaded]);

  // --- Helpers ---
  
  const triggerStarsConfetti = () => {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    for (let i = 0; i < 35; i++) {
        setTimeout(() => createStar(container), i * 50);
    }
  };

  // --- Callbacks ---

  const handleAddTransaction = (txData: Omit<Transaction, 'id' | 'date'>, personalCategory?: CategoryType) => {
    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      ...txData,
      date: 'Hoy',
    };
    if (isFamilyMode) {
      setFamilyTransactions(prev => [newTx, ...prev]);
      
      if (newTx.type === 'income') {
        const personalTx: Transaction = {
          id: 'tx-pers-' + Date.now() + Math.random(),
          type: 'expense',
          amount: newTx.amount,
          category: personalCategory || '50_NEEDS',
          description: `Aporte a familia: ${newTx.description}`,
          date: 'Hoy',
          icon: 'family_restroom'
        };
        setTransactions(prev => [personalTx, ...prev]);
      }
    } else {
      setTransactions(prev => [newTx, ...prev]);
    }

    setRewardMessage(`📊 ${txData.type === 'income' ? 'Ingreso' : 'Movimiento'} registrado con éxito.`);
    setShowRewardNotification(true);
    triggerStarsConfetti();
    setTimeout(() => {
      setShowRewardNotification(false);
      setActiveTab('home');
    }, 2500);
  };

  const handleAddNewGoal = (goalData: Omit<Goal, 'id' | 'currentAmount' | 'completed' | 'dateCreated'>) => {
    const newId = 'goal-' + Date.now();
    const newGoal: Goal = {
      ...goalData,
      id: newId,
      currentAmount: 0,
      completed: false,
      dateCreated: new Date().toISOString().split('T')[0]
    };
    
    if (isFamilyMode) {
      setFamilyGoals(prev => [...prev, newGoal]);
    } else {
      setGoals(prev => [...prev, newGoal]);
    }

    setRewardMessage(`🎯 Nueva meta registrada: "${goalData.title}"`);
    setShowRewardNotification(true);
    setTimeout(() => {
      setShowRewardNotification(false);
    }, 2500);
  };

  const handleAddAmountToGoal = (goalId: string, amount: number, createdBy?: string, createdByAvatar?: string) => {
     const updateFn = (prev: Goal[]) => prev.map(g => {
       if (g.id === goalId) {
         const updated = g.currentAmount + amount;
         if (updated >= g.targetAmount) {
           setTimeout(() => {
             setRewardMessage(`🎉 ¡Felicidades! Has completado: "${g.title}"`);
             setShowRewardNotification(true);
             triggerStarsConfetti();
             setTimeout(() => setShowRewardNotification(false), 3000);
           }, 500);
         }
         return {
           ...g,
           currentAmount: updated,
           completed: updated >= g.targetAmount
         };
       }
       return g;
     });

     if (isFamilyMode) {
       setFamilyGoals(updateFn);
     } else {
       setGoals(updateFn);
     }

     // Automatically register transaction in history as savings
     const targetGoal = isFamilyMode ? familyGoals.find(g => g.id === goalId) : goals.find(g => g.id === goalId);
     const newTx: Transaction = {
        id: 'tx-' + Date.now(),
        type: 'expense',
        amount: amount,
        category: '20_SAVINGS',
        description: `Abono a: ${targetGoal?.title || 'Meta'}`,
        date: 'Hoy',
        icon: 'account_balance',
        createdBy: isFamilyMode ? createdBy : undefined,
        createdByAvatar: isFamilyMode ? createdByAvatar : undefined
     };
     
     if (isFamilyMode) {
       setFamilyTransactions(prev => [newTx, ...prev]);
       // As requested, also deduct from personal budget and categorize as savings
       const personalTx: Transaction = {
         ...newTx,
         id: 'tx-pers-' + Date.now() + Math.random(),
         description: `Aporte a meta familiar: ${targetGoal?.title || 'Meta'}`
       };
       setTransactions(prev => [personalTx, ...prev]);
     } else {
       setTransactions(prev => [newTx, ...prev]);
     }
  };

  const handleSaveSettings = (name: string, avatar: AvatarOption, currencyVal: string) => {
    setUserName(name);
    setActiveAvatar(avatar);
    setCurrency(currencyVal);
    setIsSettingsOpen(false);

    setRewardMessage(`⚙️ Perfil actualizado con éxito, ${name}.`);
    setShowRewardNotification(true);
    setTimeout(() => {
      setShowRewardNotification(false);
    }, 2000);
  };

  const handleUpdateFamilyMembers = (updatedMembers: any[]) => {
    if (familyData) {
      const updated = {
        ...familyData,
        members: updatedMembers
      };
      setFamilyData(updated);
      localStorage.setItem('fin_family_data', JSON.stringify(updated));
    }
  };

  const handleLogin = (name: string, email: string, uid: string, verified: boolean) => {
    console.log("Joined with Firebase:", name);
  };

  const handleCompleteOnboarding = (initialTxs: Omit<Transaction, 'id' | 'date'>[]) => {
    localStorage.setItem('fin_onboarded', 'true');
    setHasCompletedOnboarding(true);

    const newTxs: Transaction[] = initialTxs.map(tx => ({
      ...tx,
      id: 'tx-init-' + Date.now() + Math.random(),
      date: 'Hoy'
    }));

    setTransactions(newTxs);
    setGoals([]);
    setFamilyTransactions([]);
    setFamilyGoals([]);
    setFamilyData(null);
    setIsFamilyMode(false);
  };

  const handleDeleteTransaction = (id: string) => {
    if (isFamilyMode) {
      setFamilyTransactions(prev => prev.filter(tx => tx.id !== id));
      // Also cleanup personal linked transation if they were created together (basic matching by substring if needed, or by exact id match just in case)
      setTransactions(prev => prev.filter(tx => tx.id !== id && !tx.id.includes(id)));
    } else {
      setTransactions(prev => prev.filter(tx => tx.id !== id));
    }
    
    setRewardMessage('🗑️ Movimiento eliminado');
    setShowRewardNotification(true);
    setTimeout(() => {
      setShowRewardNotification(false);
    }, 2000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    setIsSettingsOpen(false);
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  const currentTransactions = isFamilyMode ? familyTransactions : transactions;
  const currentGoals = isFamilyMode ? familyGoals : goals;

  if (!isAuthenticated) {
    return <AuthView onLogin={handleLogin} />;
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingWizard userName={userName} onComplete={handleCompleteOnboarding} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 selection:bg-indigo-100">
      
      {/* Absolute Confetti Holder */}
      <div id="confetti-container" className="fixed inset-0 pointer-events-none z-[100] overflow-hidden overflow-x-hidden w-full h-full"></div>

      {/* Global Reward Toast */}
      {showRewardNotification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] animate-toast-slide max-w-[90%] w-full flex justify-center">
          <div className="bg-slate-900 text-white px-5 py-3 rounded-xl border border-slate-800 shadow-xl font-bold text-xs flex items-center justify-center gap-2">
            <span>{rewardMessage}</span>
          </div>
        </div>
      )}

      {/* Settings Modal Configurator */}
      {isSettingsOpen && (
        <SettingsModal
          currentName={userName}
          currentAvatar={activeAvatar}
          currentCurrency={currency}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
          onLogout={handleLogout}
        />
      )}

      <Header 
        currentAvatar={activeAvatar} 
        isFamilyMode={isFamilyMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="max-w-base lg:max-w-lg mx-auto px-4 py-4 w-full flex flex-col items-center">
        {isFamilyMode && !familyData ? (
          <FamilySetupView 
            onFamilyCreated={(data) => {
              setFamilyData(data);
              setRewardMessage(`👨‍👩‍👧‍👦 Modo Familiar Creado: ${data.name}`);
              setShowRewardNotification(true);
              setTimeout(() => setShowRewardNotification(false), 3000);
            }} 
            onCancel={() => setIsFamilyMode(false)}
          />
        ) : (
          <div className="w-full relative">
            <AnimatePresence mode="wait">
              {activeTab === 'home' && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <HomeTab
                    userName={userName}
                    transactions={currentTransactions}
                    goals={currentGoals}
                    onAddTransaction={() => setActiveTab('add')}
                    isFamilyMode={isFamilyMode}
                    familyData={familyData}
                    onUpdateFamilyMembers={handleUpdateFamilyMembers}
                  />
                </motion.div>
              )}
              
              {activeTab === 'goals' && (
                <motion.div
                  key="goals"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <DreamsTab 
                     goals={currentGoals}
                     transactions={currentTransactions}
                     onAddAmountToGoal={handleAddAmountToGoal}
                     onAddNewGoal={handleAddNewGoal}
                     isFamilyMode={isFamilyMode}
                     familyData={familyData}
                  />
                </motion.div>
              )}

              {activeTab === 'add' && (
                <motion.div
                  key="add"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <AddTab
                    onAddTransaction={handleAddTransaction}
                    isFamilyMode={isFamilyMode}
                    familyData={familyData}
                  />
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <PathTab
                    transactions={currentTransactions}
                    onDeleteTransaction={handleDeleteTransaction}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      {(!isFamilyMode || familyData) && (
        <NavBar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isFamilyMode={isFamilyMode}
          toggleFamilyMode={() => setIsFamilyMode(!isFamilyMode)}
        />
      )}
    </div>
  );
}
