import type { ApprovalStatus, Transaction, WishlistItem } from '../types'

export function getApprovedTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter((t) => t.status === 'approved')
}

export function getVisibleWishlistForDependant(wishlist: WishlistItem[]): WishlistItem[] {
  return wishlist.filter((w) => w.status !== 'rejected')
}

export function statusLabel(status: ApprovalStatus): string {
  switch (status) {
    case 'pending': return 'Pending'
    case 'approved': return 'Approved'
    case 'rejected': return 'Rejected'
  }
}

export function statusColor(status: ApprovalStatus): string {
  switch (status) {
    case 'pending': return 'bg-wishlist/20 text-wishlist'
    case 'approved': return 'bg-income/20 text-income'
    case 'rejected': return 'bg-danger/20 text-red-300'
  }
}
