import type { Pillar, RelationshipType } from './types'

export const STORAGE_KEY = 'money-manager-state'

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

/** How the sponsor relates to the dependant */
export const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string; description: string }[] = [
  { value: 'parent', label: 'Parent', description: 'Sponsor is the parent of the dependant' },
  { value: 'child', label: 'Adult child', description: 'Sponsor is an adult child supporting the dependant' },
  { value: 'spouse', label: 'Spouse', description: 'Sponsor is the spouse or partner of the dependant' },
  { value: 'sibling', label: 'Sibling', description: 'Sponsor is a sibling of the dependant' },
  { value: 'friend', label: 'Friend', description: 'Sponsor is a friend supporting the dependant' },
]

export function relationshipLabel(type: RelationshipType): string {
  return RELATIONSHIP_OPTIONS.find((r) => r.value === type)?.label ?? type
}
