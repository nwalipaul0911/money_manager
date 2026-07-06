import type { BudgetProfile, Pillar, Transaction, WishlistAllocation } from '../types'
import { getApprovedTransactions } from './profiles'

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

export function sumFixedExpenses(profile: BudgetProfile): number {
  return profile.fixedExpenses.reduce((sum, e) => sum + e.amount, 0)
}

export function getDiscretionaryPool(profile: BudgetProfile): number {
  return Math.max(0, profile.netIncome - sumFixedExpenses(profile))
}

export function getWantsBudget(profile: BudgetProfile): number {
  return getDiscretionaryPool(profile) * (profile.wantsBudgetPercent / 100)
}

export function getSpentByPillar(
  transactions: Transaction[],
  pillar: Pillar,
  monthKey = getMonthKey(),
): number {
  return getTransactionsForMonth(getApprovedTransactions(transactions), monthKey)
    .filter((t) => t.pillar === pillar)
    .reduce((sum, t) => sum + t.amount, 0)
}

export function getUnspentWants(
  profile: BudgetProfile,
  transactions: Transaction[],
  monthKey = getMonthKey(),
): number {
  const budget = getWantsBudget(profile)
  const spent = getSpentByPillar(transactions, 'wants', monthKey)
  return Math.max(0, budget - spent)
}

export function isCoolingOff(item: { status: string; coolingOffUntil: string }): boolean {
  if (item.status !== 'approved') return false
  return new Date(item.coolingOffUntil) > new Date()
}

export function getCoolingOffRemaining(item: { coolingOffUntil: string }): {
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

export function getWishlistProgress(item: { targetAmount: number; savedAmount: number }): number {
  if (item.targetAmount <= 0) return 0
  return Math.min(100, (item.savedAmount / item.targetAmount) * 100)
}

export function isFullyFunded(item: { targetAmount: number; savedAmount: number }): boolean {
  return item.savedAmount >= item.targetAmount
}

export function getWishlistAllocatedThisMonth(
  allocations: WishlistAllocation[],
  profileId: string,
  monthKey = getMonthKey(),
): number {
  return allocations
    .filter((a) => a.profileId === profileId && a.date.startsWith(monthKey))
    .reduce((sum, a) => sum + a.amount, 0)
}

export function getAvailableForAllocation(
  profile: BudgetProfile,
  transactions: Transaction[],
  allocations: WishlistAllocation[],
  monthKey = getMonthKey(),
): number {
  const unspent = getUnspentWants(profile, transactions, monthKey)
  const allocated = getWishlistAllocatedThisMonth(allocations, profile.id, monthKey)
  return Math.max(0, unspent - allocated)
}

export function getSpendingSummary(
  profile: BudgetProfile,
  transactions: Transaction[],
  monthKey = getMonthKey(),
): {
  needsSpent: number
  wantsSpent: number
  pendingCount: number
  approvedCount: number
  rejectedCount: number
} {
  const monthTx = getTransactionsForMonth(transactions, monthKey).filter((t) => t.profileId === profile.id)
  const approved = monthTx.filter((t) => t.status === 'approved')
  return {
    needsSpent: approved.filter((t) => t.pillar === 'needs').reduce((s, t) => s + t.amount, 0),
    wantsSpent: approved.filter((t) => t.pillar === 'wants').reduce((s, t) => s + t.amount, 0),
    pendingCount: monthTx.filter((t) => t.status === 'pending').length,
    approvedCount: monthTx.filter((t) => t.status === 'approved').length,
    rejectedCount: monthTx.filter((t) => t.status === 'rejected').length,
  }
}

/** @deprecated use getSpendingSummary */
export const getChildBehaviorSummary = getSpendingSummary
