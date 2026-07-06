export type Pillar = 'needs' | 'wants'
export type ApprovalStatus = 'approved' | 'pending' | 'rejected'
export type RelationshipType = 'parent' | 'child' | 'spouse' | 'sibling' | 'friend'

export interface FixedExpense {
  id: string
  name: string
  amount: number
}

export interface BudgetProfile {
  id: string
  name: string
  netIncome: number
  wantsBudgetPercent: number
  fixedExpenses: FixedExpense[]
  autoAllocateWants: boolean
  onboardingComplete: boolean
}

export interface SponsorLink {
  id: string
  sponsorProfileId: string
  dependantProfileId: string
  relationship: RelationshipType
}

export interface Transaction {
  id: string
  profileId: string
  amount: number
  date: string
  category: string
  pillar: Pillar
  note?: string
  status: ApprovalStatus
  submittedAt: string
  reviewedAt?: string
  reviewedByProfileId?: string
}

export interface WishlistItem {
  id: string
  profileId: string
  name: string
  targetAmount: number
  savedAmount: number
  createdAt: string
  coolingOffUntil: string
  status: ApprovalStatus
  reviewedAt?: string
  reviewedByProfileId?: string
}

export interface WishlistAllocation {
  id: string
  profileId: string
  itemId: string
  amount: number
  date: string
  allocatedByProfileId?: string
}

export interface NetworkMember {
  userId: string
  name: string
  email: string
  relationship: RelationshipType
}

export interface UserContext {
  userId: string
  email: string
  profile: BudgetProfile
  isDependant: boolean
  isSponsor: boolean
  dependants: NetworkMember[]
  sponsors: NetworkMember[]
  pendingReviewCount: number
}

export interface ProfileData {
  profile: BudgetProfile
  isOwnProfile: boolean
  isDependant: boolean
  canEdit: boolean
  canLog: boolean
  canAllocateWishlist: boolean
  needsApproval: boolean
  transactions: Transaction[]
  wishlist: WishlistItem[]
  wishlistAllocations: WishlistAllocation[]
  sponsorLinks: SponsorLink[]
}

export interface Invitation {
  id: string
  token: string
  inviteeEmail: string
  relationship: RelationshipType
  status: string
  sponsorName: string
  createdAt: string
  expiresAt: string
}

export interface PendingReview {
  transactions: Transaction[]
  wishlist: WishlistItem[]
  dependants: { userId: string; name: string; relationship: string }[]
}

export type Tab = 'dashboard' | 'log' | 'wishlist' | 'review' | 'settings'

/** View context for components that still use calculation helpers */
export interface ViewState {
  profile: BudgetProfile
  transactions: Transaction[]
  wishlist: WishlistItem[]
  wishlistAllocations: WishlistAllocation[]
  needsApproval: boolean
  canAllocateWishlist: boolean
  isOwnProfile: boolean
}
