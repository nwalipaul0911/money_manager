import type { AppState, Pillar, Transaction, WishlistItem } from '../types'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function getTransactionsForMonth(
  transactions: Transaction[],
  monthKey = getMonthKey(),
): Transaction[] {
  return transactions.filter((t) => t.date.startsWith(monthKey))
}

export function sumFixedExpenses(state: AppState): number {
  return state.fixedExpenses.reduce((sum, e) => sum + e.amount, 0)
}

export function getDiscretionaryPool(state: AppState): number {
  return Math.max(0, state.netIncome - sumFixedExpenses(state))
}

export function getWantsBudget(state: AppState): number {
  return getDiscretionaryPool(state) * (state.wantsBudgetPercent / 100)
}

export function getSpentByPillar(
  transactions: Transaction[],
  pillar: Pillar,
  monthKey = getMonthKey(),
): number {
  return getTransactionsForMonth(transactions, monthKey)
    .filter((t) => t.pillar === pillar)
    .reduce((sum, t) => sum + t.amount, 0)
}

export function getUnspentWants(state: AppState, monthKey = getMonthKey()): number {
  const budget = getWantsBudget(state)
  const spent = getSpentByPillar(state.transactions, 'wants', monthKey)
  return Math.max(0, budget - spent)
}

export function isCoolingOff(item: WishlistItem): boolean {
  return new Date(item.coolingOffUntil) > new Date()
}

export function getCoolingOffRemaining(item: WishlistItem): {
  hours: number
  minutes: number
  expired: boolean
} {
  const diff = new Date(item.coolingOffUntil).getTime() - Date.now()
  if (diff <= 0) return { hours: 0, minutes: 0, expired: true }
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return { hours, minutes, expired: false }
}

export function getWishlistProgress(item: WishlistItem): number {
  if (item.targetAmount <= 0) return 0
  return Math.min(100, (item.savedAmount / item.targetAmount) * 100)
}

export function isFullyFunded(item: WishlistItem): boolean {
  return item.savedAmount >= item.targetAmount
}

export function getWishlistAllocatedThisMonth(
  allocations: AppState['wishlistAllocations'],
  monthKey = getMonthKey(),
): number {
  return allocations
    .filter((a) => a.date.startsWith(monthKey))
    .reduce((sum, a) => sum + a.amount, 0)
}

export function getAvailableForAllocation(state: AppState, monthKey = getMonthKey()): number {
  const unspent = getUnspentWants(state, monthKey)
  const allocated = getWishlistAllocatedThisMonth(state.wishlistAllocations, monthKey)
  return Math.max(0, unspent - allocated)
}
