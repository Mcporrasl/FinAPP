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
import { doc, getDoc, setDoc, collection, onSnapshot, query, deleteDoc, updateDoc, getDocs, where } from 'firebase/firestore';

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

  // Firestore Subscriptions
  useEffect(() => {
    if (!currentUser || isAuthChecking || !isProfileLoaded) return;

    // Sub to Personal Transactions
    const txRef = collection(db, 'users', currentUser.uid, 'transactions');
    const unsubTx = onSnapshot(query(txRef), (snapshot) => {
      const fetchedTx: Transaction[] = [];
      snapshot.forEach(docSnap => {
        fetchedTx.push({ id: docSnap.id, ...docSnap.data() } as Transaction);
      });
      // Sort by date or id falling back to keep order somewhat stable
      fetchedTx.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setTransactions(fetchedTx);
    });

    // Sub to Personal Goals
    const goalsRef = collection(db, 'users', currentUser.uid, 'goals');
    const unsubGoals = onSnapshot(query(goalsRef), (snapshot) => {
      const fetchedGoals: Goal[] = [];
      snapshot.forEach(docSnap => {
        fetchedGoals.push({ id: docSnap.id, ...docSnap.data() } as Goal);
      });
      fetchedGoals.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      setGoals(fetchedGoals);
    });
    
    // Automatically check if user owns a family to recover it if they just logged in on a new device
    if (isFamilyMode && !familyData) {
      const familiesRef = collection(db, 'families');
      const q = query(familiesRef, where('ownerId', '==', currentUser.uid));
      getDocs(q).then(snap => {
        if (!snap.empty) {
          const fDoc = snap.docs[0];
          // We need members too
          getDocs(collection(db, 'families', fDoc.id, 'members')).then(memSnap => {
            const members = memSnap.docs.map(m => ({
              id: m.id,
              ...m.data()
            }));
            setFamilyData({
              id: fDoc.id,
              name: fDoc.data().name,
              inviteCode: fDoc.data().inviteCode,
              members: members as any
            });
          });
        }
      }).catch(console.error);
    }

    return () => {
      unsubTx();
      unsubGoals();
    };
  }, [currentUser, isAuthChecking, isProfileLoaded]);

  // Family Subscriptions
  useEffect(() => {
    if (!currentUser || isAuthChecking || !isProfileLoaded || !isFamilyMode || !familyData?.id) return;
    
    const familyId = familyData.id;

    // Sub to Family Transactions
    const fTxRef = collection(db, 'families', familyId, 'transactions');
    const unsubFTx = onSnapshot(query(fTxRef), (snapshot) => {
      const fetchedTx: Transaction[] = [];
      snapshot.forEach(docSnap => {
        fetchedTx.push({ id: docSnap.id, ...docSnap.data() } as Transaction);
      });
      fetchedTx.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setFamilyTransactions(fetchedTx);
    });

    // Sub to Family Goals
    const fGoalsRef = collection(db, 'families', familyId, 'goals');
    const unsubFGoals = onSnapshot(query(fGoalsRef), (snapshot) => {
      const fetchedGoals: Goal[] = [];
      snapshot.forEach(docSnap => {
        fetchedGoals.push({ id: docSnap.id, ...docSnap.data() } as Goal);
      });
      fetchedGoals.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      setFamilyGoals(fetchedGoals);
    });

    // Sub to Family Members to keep them updated
    const fMembersRef = collection(db, 'families', familyId, 'members');
    const unsubFMembers = onSnapshot(query(fMembersRef), (snapshot) => {
      const members: any[] = [];
      snapshot.forEach(m => members.push({ id: m.id, ...m.data() }));
      setFamilyData(prev => prev ? { ...prev, members } : null);
    });

    return () => {
      unsubFTx();
      unsubFGoals();
      unsubFMembers();
    };
  }, [currentUser, isAuthChecking, isProfileLoaded, isFamilyMode, familyData?.id]);


  // --- Helpers ---
  
  const triggerStarsConfetti = () => {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    for (let i = 0; i < 35; i++) {
        setTimeout(() => createStar(container), i * 50);
    }
  };

  // --- Callbacks ---

  const handleAddTransaction = (txData: Omit<Transaction, 'id' | 'date' | 'createdAt' | 'userId' | 'familyId'>, personalCategory?: CategoryType) => {
    if (!currentUser) return;
    
    const baseTx = {
      ...txData,
      date: 'Hoy',
      createdAt: new Date().toISOString()
    };

    if (isFamilyMode && familyData) {
      const ftxRef = doc(collection(db, 'families', familyData.id, 'transactions'));
      setDoc(ftxRef, { 
        ...baseTx, 
        id: ftxRef.id,
        familyId: familyData.id,
        createdBy: userName,
        createdByAvatar: activeAvatar.imageUrl
      }).catch(console.error);
      
      if (txData.type === 'income') {
        const ptxRef = doc(collection(db, 'users', currentUser.uid, 'transactions'));
        setDoc(ptxRef, {
          id: ptxRef.id,
          type: 'expense',
          amount: baseTx.amount,
          category: personalCategory || '50_NEEDS',
          description: `Aporte a familia: ${baseTx.description}`,
          date: 'Hoy',
          icon: 'family_restroom',
          createdAt: baseTx.createdAt,
          userId: currentUser.uid
        }).catch(console.error);
      }
    } else {
      const ptxRef = doc(collection(db, 'users', currentUser.uid, 'transactions'));
      setDoc(ptxRef, {
        ...baseTx,
        id: ptxRef.id,
        userId: currentUser.uid
      }).catch(console.error);
    }

    setRewardMessage(`📊 ${txData.type === 'income' ? 'Ingreso' : 'Movimiento'} registrado con éxito.`);
    setShowRewardNotification(true);
    triggerStarsConfetti();
    setTimeout(() => {
      setShowRewardNotification(false);
      setActiveTab('home');
    }, 2500);
  };

  const handleAddNewGoal = (goalData: Omit<Goal, 'id' | 'currentAmount' | 'completed' | 'dateCreated' | 'createdAt' | 'userId' | 'familyId'>) => {
    if (!currentUser) return;

    const baseGoal = {
      ...goalData,
      currentAmount: 0,
      completed: false,
      dateCreated: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    
    if (isFamilyMode && familyData) {
      const fgRef = doc(collection(db, 'families', familyData.id, 'goals'));
      setDoc(fgRef, {
        ...baseGoal,
        id: fgRef.id,
        familyId: familyData.id
      }).catch(console.error);
    } else {
      const gRef = doc(collection(db, 'users', currentUser.uid, 'goals'));
      setDoc(gRef, {
        ...baseGoal,
        id: gRef.id,
        userId: currentUser.uid
      }).catch(console.error);
    }

    setRewardMessage(`🎯 Nueva meta registrada: "${goalData.title}"`);
    setShowRewardNotification(true);
    setTimeout(() => {
      setShowRewardNotification(false);
    }, 2500);
  };

  const handleAddAmountToGoal = (goalId: string, amount: number, createdBy?: string, createdByAvatar?: string) => {
     if (!currentUser) return;
     
     const tDate = new Date().toISOString();
     const isFam = isFamilyMode && familyData;
     const targetGoalList = isFam ? familyGoals : goals;
     const targetGoal = targetGoalList.find(g => g.id === goalId);
     
     if (!targetGoal) return;
     
     const updatedAmount = targetGoal.currentAmount + amount;
     const isCompleted = updatedAmount >= targetGoal.targetAmount;

     // Update Goal
     if (isFam) {
       const fgRef = doc(db, 'families', familyData.id, 'goals', goalId);
       updateDoc(fgRef, { currentAmount: updatedAmount, completed: isCompleted }).catch(console.error);
     } else {
       const gRef = doc(db, 'users', currentUser.uid, 'goals', goalId);
       updateDoc(gRef, { currentAmount: updatedAmount, completed: isCompleted }).catch(console.error);
     }

     if (isCompleted) {
       setTimeout(() => {
         setRewardMessage(`🎉 ¡Felicidades! Has completado: "${targetGoal.title}"`);
         setShowRewardNotification(true);
         triggerStarsConfetti();
         setTimeout(() => setShowRewardNotification(false), 3000);
       }, 500);
     }

     // Automatically register transaction in history as savings
     const baseTx = {
        type: 'expense' as const,
        amount: amount,
        category: '20_SAVINGS' as const,
        description: `Abono a: ${targetGoal.title}`,
        date: 'Hoy',
        icon: 'account_balance',
        createdAt: tDate
     };
     
     if (isFam) {
       const ftxRef = doc(collection(db, 'families', familyData.id, 'transactions'));
       setDoc(ftxRef, {
         ...baseTx,
         id: ftxRef.id,
         familyId: familyData.id,
         createdBy: createdBy || userName,
         createdByAvatar: createdByAvatar || activeAvatar.imageUrl
       }).catch(console.error);

       const ptxRef = doc(collection(db, 'users', currentUser.uid, 'transactions'));
       setDoc(ptxRef, {
         ...baseTx,
         id: ptxRef.id,
         userId: currentUser.uid,
         description: `Aporte a meta familiar: ${targetGoal.title}`
       }).catch(console.error);
     } else {
       const ptxRef = doc(collection(db, 'users', currentUser.uid, 'transactions'));
       setDoc(ptxRef, {
         ...baseTx,
         id: ptxRef.id,
         userId: currentUser.uid
       }).catch(console.error);
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

  const handleUpdateFamilyMembers = async (updatedMembers: any[]) => {
    if (familyData && currentUser) {
      try {
        // Simple sync strategy to firestore subcollection
        // Any member in current familyData not in updatedMembers should be deleted.
        // Any member in updatedMembers not in current familyData should be added.
        const currentIds = new Set(familyData.members.map(m => m.id));
        const updatedIds = new Set(updatedMembers.map(m => m.id));

        // Deletions
        const toDelete = familyData.members.filter(m => !updatedIds.has(m.id));
        for (const item of toDelete) {
           const ref = doc(db, 'families', familyData.id, 'members', item.id);
           await deleteDoc(ref).catch(console.error);
        }

        // Additions/Updates
        const toUpdate = updatedMembers.filter(m => !currentIds.has(m.id));
        for (const item of toUpdate) {
           const ref = doc(db, 'families', familyData.id, 'members', item.id);
           await setDoc(ref, {
             ...item,
             createdAt: new Date().toISOString()
           }).catch(console.error);
        }
        
      } catch (error) {
        console.error("Error updating members in Firestore:", error);
      }
    }
  };

  const handleLogin = (name: string, email: string, uid: string, verified: boolean) => {
    console.log("Joined with Firebase:", name);
  };

  const handleCompleteOnboarding = (initialTxs: Omit<Transaction, 'id' | 'date' | 'createdAt' | 'userId' | 'familyId'>[]) => {
    localStorage.setItem('fin_onboarded', 'true');
    setHasCompletedOnboarding(true);

    if (currentUser) {
      initialTxs.forEach((tx) => {
        const ptxRef = doc(collection(db, 'users', currentUser.uid, 'transactions'));
        setDoc(ptxRef, {
          ...tx,
          id: ptxRef.id,
          userId: currentUser.uid,
          date: 'Hoy',
          createdAt: new Date().toISOString()
        }).catch(console.error);
      });
      const uRef = doc(db, 'users', currentUser.uid);
      updateDoc(uRef, { hasCompletedOnboarding: true }).catch(console.error);
    }
    
    // Clear out family mode completely upon resetting
    setFamilyData(null);
    setIsFamilyMode(false);
  };

  const handleDeleteTransaction = (id: string) => {
    if (!currentUser) return;
    
    if (isFamilyMode && familyData) {
      // Find in family
      const ftxRef = doc(db, 'families', familyData.id, 'transactions', id);
      deleteDoc(ftxRef).catch(console.error);
    } else {
      // Find in personal
      const ptxRef = doc(db, 'users', currentUser.uid, 'transactions', id);
      deleteDoc(ptxRef).catch(console.error);
    }
    
    setRewardMessage('🗑️ Movimiento eliminado');
    setShowRewardNotification(true);
    setTimeout(() => {
      setShowRewardNotification(false);
    }, 2000);
  };

  const handleCreateFamily = async (data: FamilyData) => {
    if (!currentUser) return;
    try {
      const familyId = data.inviteCode; // Use invite code as the actual document ID!
      const fRef = doc(db, 'families', familyId);
      
      // Check if code is taken (rare but possible)
      const existing = await getDoc(fRef);
      if (existing.exists()) {
         alert("Hubo un error de colisión de código. Por favor intenta crear la familia otra vez.");
         return;
      }

      const familyPayload = {
        ownerId: currentUser.uid,
        name: data.name,
        inviteCode: data.inviteCode,
        createdAt: new Date().toISOString()
      };
      await setDoc(fRef, familyPayload);
      
      const memberRef = doc(db, 'families', familyId, 'members', currentUser.uid);
      await setDoc(memberRef, {
        name: userName,
        role: 'admin',
        avatarUrl: activeAvatar.imageUrl,
        createdAt: new Date().toISOString()
      });
      
      setFamilyData({
        id: familyId,
        name: data.name,
        inviteCode: data.inviteCode,
        members: [{ id: currentUser.uid, name: userName, role: 'admin', avatarUrl: activeAvatar.imageUrl }]
      });
      
      setRewardMessage(`👨‍👩‍👧‍👦 Modo Familiar Creado: ${data.name}`);
      setShowRewardNotification(true);
      setTimeout(() => setShowRewardNotification(false), 3000);
    } catch (e) {
      console.error(e);
      alert('Error creando la familia. Revisa los permisos.');
    }
  };

  const handleJoinFamily = async (code: string) => {
    if (!currentUser) return;
    try {
      const familyId = code.toUpperCase();
      const fRef = doc(db, 'families', familyId);
      const fDoc = await getDoc(fRef);
      
      if (!fDoc.exists()) {
        alert("El código ingresado es incorrecto o la familia no existe.");
        return;
      }
      
      const memberRef = doc(db, 'families', familyId, 'members', currentUser.uid);
      await setDoc(memberRef, {
        name: userName,
        role: 'member',
        avatarUrl: activeAvatar.imageUrl,
        createdAt: new Date().toISOString()
      });
      
      const memSnap = await getDocs(collection(db, 'families', familyId, 'members'));
      const members = memSnap.docs.map(m => ({ id: m.id, ...m.data() }));

      setFamilyData({
        id: familyId,
        name: fDoc.data().name,
        inviteCode: fDoc.data().inviteCode,
        members: members as any
      });
      
      setRewardMessage(`👨‍👩‍👧‍👦 Te has unido a la familia`);
      setShowRewardNotification(true);
      setTimeout(() => setShowRewardNotification(false), 3000);
    } catch (e) {
      console.error(e);
      alert('Error al intentar unirse a la familia.');
    }
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
            onFamilyCreated={handleCreateFamily} 
            onFamilyJoined={handleJoinFamily}
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
        <footer className="w-full text-center mt-auto pt-10 pb-24 text-[10px] sm:text-[11px] text-slate-400 font-medium">
          Developed by Engineer Maria Camila Porras Leguizamon. <br/>
          All intellectual property rights reserved © {new Date().getFullYear()} • v2.0
        </footer>
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
