import { DEFAULT_WANTS_BUDGET_PERCENT, STORAGE_KEY } from './constants'
import type { AppState } from './types'

export const defaultState: AppState = {
  onboardingComplete: false,
  netIncome: 0,
  wantsBudgetPercent: DEFAULT_WANTS_BUDGET_PERCENT,
  fixedExpenses: [],
  transactions: [],
  wishlist: [],
  wishlistAllocations: [],
  autoAllocateWants: false,
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultState }
    return { ...defaultState, ...JSON.parse(raw) }
  } catch {
    return { ...defaultState }
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function generateId(): string {
  return crypto.randomUUID()
}
