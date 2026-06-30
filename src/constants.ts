import type { Pillar } from './types'

export const STORAGE_KEY = 'money-manager-state'

/** Mandatory cooling-off period before a wishlist item can receive funds */
export const COOLING_OFF_HOURS = 72

export const NEEDS_CATEGORIES = [
  'Groceries',
  'Transport',
  'Healthcare',
  'Household',
  'Personal Care',
  'Other Needs',
] as const

export const WANTS_CATEGORIES = [
  'Dining Out',
  'Entertainment',
  'Shopping',
  'Hobbies',
  'Travel',
  'Subscriptions',
  'Other Wants',
] as const

export const CATEGORIES_BY_PILLAR: Record<Pillar, readonly string[]> = {
  needs: NEEDS_CATEGORIES,
  wants: WANTS_CATEGORIES,
}

export const DEFAULT_WANTS_BUDGET_PERCENT = 30
