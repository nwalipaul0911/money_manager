export type Pillar = 'needs' | 'wants'

export interface FixedExpense {
  id: string
  name: string
  amount: number
}

export interface Transaction {
  id: string
  amount: number
  date: string
  category: string
  pillar: Pillar
  note?: string
}

export interface WishlistItem {
  id: string
  name: string
  targetAmount: number
  savedAmount: number
  createdAt: string
  coolingOffUntil: string
}

export interface WishlistAllocation {
  id: string
  itemId: string
  amount: number
  date: string
}

export interface AppState {
  onboardingComplete: boolean
  netIncome: number
  wantsBudgetPercent: number
  fixedExpenses: FixedExpense[]
  transactions: Transaction[]
  wishlist: WishlistItem[]
  wishlistAllocations: WishlistAllocation[]
  autoAllocateWants: boolean
}

export type Tab = 'dashboard' | 'log' | 'wishlist' | 'settings'
