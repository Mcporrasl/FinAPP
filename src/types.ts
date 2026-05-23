/**
 * Types and interfaces for Finanzas 50/30/20
 */

export type CategoryType = '50_NEEDS' | '30_WANTS' | '20_SAVINGS' | 'INCOME';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: CategoryType;
  description: string;
  date: string;
  icon: string;
  createdBy?: string;
  createdByAvatar?: string;
  createdAt?: string;
  userId?: string;
  familyId?: string;
}

export type GoalType = 'DEBT' | 'SAVINGS';

export interface Goal {
  id: string;
  title: string;
  type: GoalType;
  description: string;
  icon: string;
  currentAmount: number;
  targetAmount: number;
  completed: boolean;
  dateCreated: string;
  createdAt?: string;
  userId?: string;
  familyId?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: 'admin' | 'member';
  avatarUrl: string;
}

export interface FamilyData {
  id: string;
  name: string;
  members: FamilyMember[];
  inviteCode: string;
}

export type SubscriptionTier = 'free' | 'pro_monthly' | 'pro_annual' | 'pro_lifetime';

export type TabType = 'home' | 'goals' | 'add' | 'history' | 'subscription';

export interface AvatarOption {
  id: string;
  name: string;
  imageUrl: string;
  animationClass: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'avatar-1',
    name: 'Motivado',
    imageUrl: 'https://api.dicebear.com/9.x/micah/svg?seed=Felix&backgroundColor=b6e3f4',
    animationClass: 'animate-bounce-slow'
  },
  {
    id: 'avatar-2',
    name: 'Tranquilo',
    imageUrl: 'https://api.dicebear.com/9.x/micah/svg?seed=Aneka&backgroundColor=c0aede',
    animationClass: 'animate-pulse-slow'
  },
  {
    id: 'avatar-3',
    name: 'Enfocado',
    imageUrl: 'https://api.dicebear.com/9.x/micah/svg?seed=Leo&backgroundColor=ffdfbf',
    animationClass: 'animate-float'
  },
  {
    id: 'avatar-4',
    name: 'Festivo',
    imageUrl: 'https://api.dicebear.com/9.x/micah/svg?seed=Destiny&backgroundColor=d1d4f9',
    animationClass: 'animate-wiggle'
  }
];

export const INITIAL_GOALS: Goal[] = [
  {
    id: 'goal-1',
    title: 'Saldar Tarjeta de Crédito',
    type: 'DEBT',
    description: 'Salir de la deuda con intereses altos',
    icon: 'credit_card_off',
    currentAmount: 500000,
    targetAmount: 2000000,
    completed: false,
    dateCreated: '2026-05-18'
  },
  {
    id: 'goal-2',
    title: 'Fondo de Emergencia',
    type: 'SAVINGS',
    description: 'Ahorro para imprevistos (3 meses)',
    icon: 'savings',
    currentAmount: 1200000,
    targetAmount: 4000000,
    completed: false,
    dateCreated: '2026-05-15'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'income',
    amount: 3000000,
    category: 'INCOME',
    description: 'Salario Quincenal',
    date: 'Hoy',
    icon: 'payments'
  },
  {
    id: 'tx-2',
    type: 'expense',
    amount: 900000,
    category: '50_NEEDS',
    description: 'Arriendo',
    date: 'Hoy',
    icon: 'home'
  },
  {
    id: 'tx-3',
    type: 'expense',
    amount: 250000,
    category: '50_NEEDS',
    description: 'Mercado',
    date: 'Hace 1 día',
    icon: 'shopping_cart'
  },
  {
    id: 'tx-4',
    type: 'expense',
    amount: 150000,
    category: '30_WANTS',
    description: 'Cena en restaurante',
    date: 'Hace 2 días',
    icon: 'restaurant'
  },
  {
    id: 'tx-5',
    type: 'expense',
    amount: 300000,
    category: '20_SAVINGS',
    description: 'Abono a Deuda',
    date: 'Hace 3 días',
    icon: 'account_balance'
  }
];
