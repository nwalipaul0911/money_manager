import type { PendingReview } from '../types'
import { formatCurrency } from '../utils/calculations'
import { relationshipLabel } from '../constants'
import type { RelationshipType } from '../types'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface SponsorReviewProps {
  pending: PendingReview
  onApproveTransaction: (id: string) => void
  onRejectTransaction: (id: string) => void
  onApproveWishlist: (id: string) => void
  onRejectWishlist: (id: string) => void
}

function dependantName(pending: PendingReview, profileId: string): string {
  return pending.dependants.find((d) => d.userId === profileId)?.name ?? 'Dependant'
}

function dependantRelationship(pending: PendingReview, profileId: string): string | null {
  const rel = pending.dependants.find((d) => d.userId === profileId)?.relationship
  return rel ? relationshipLabel(rel as RelationshipType) : null
}

export function SponsorReview({
  pending,
  onApproveTransaction,
  onRejectTransaction,
  onApproveWishlist,
  onRejectWishlist,
}: SponsorReviewProps) {
  const totalPending = pending.transactions.length + pending.wishlist.length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Sponsor Review</h2>
        <p className="text-text-muted text-sm mt-1">Approve or reject entries from your dependants</p>
      </div>

      {totalPending > 0 && (
        <Card className="border-wishlist/30 bg-wishlist/5">
          <p className="text-wishlist font-semibold">{totalPending} item(s) awaiting review</p>
        </Card>
      )}

      {pending.transactions.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-4">Pending Expenses</h3>
          <ul className="space-y-3">
            {pending.transactions.map((t) => {
              const rel = dependantRelationship(pending, t.profileId)
              return (
                <li key={t.id} className="bg-surface-overlay rounded-xl p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-medium">{dependantName(pending, t.profileId)} · {t.category}</p>
                      <p className="text-sm text-text-muted mt-0.5">
                        {t.pillar} · {t.date}
                        {rel && <> · {rel}</>}
                        {t.note ? ` · ${t.note}` : ''}
                      </p>
                    </div>
                    <span className="font-bold">{formatCurrency(t.amount)}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="flex-1" onClick={() => onApproveTransaction(t.id)}>Approve</Button>
                    <Button size="sm" variant="danger" className="flex-1" onClick={() => onRejectTransaction(t.id)}>Reject</Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {pending.wishlist.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-4">Pending Wishlist Items</h3>
          <ul className="space-y-3">
            {pending.wishlist.map((item) => (
              <li key={item.id} className="bg-surface-overlay rounded-xl p-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-medium">{dependantName(pending, item.profileId)} wants</p>
                    <p className="text-lg font-semibold mt-0.5">{item.name}</p>
                  </div>
                  <span className="font-bold">{formatCurrency(item.targetAmount)}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="flex-1" onClick={() => onApproveWishlist(item.id)}>Approve</Button>
                  <Button size="sm" variant="danger" className="flex-1" onClick={() => onRejectWishlist(item.id)}>Reject</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {totalPending === 0 && (
        <Card>
          <p className="text-text-muted text-sm text-center py-6">No pending items — all caught up!</p>
        </Card>
      )}

      {pending.dependants.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-3">Your Dependants</h3>
          <ul className="space-y-2">
            {pending.dependants.map((d) => (
              <li key={d.userId} className="flex justify-between text-sm bg-surface-overlay rounded-lg px-3 py-2">
                <span className="font-medium">{d.name}</span>
                <span className="text-text-muted">{relationshipLabel(d.relationship as RelationshipType)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
