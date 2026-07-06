import { useEffect, useState } from 'react'
import { COOLING_OFF_HOURS } from '../constants'
import type { ProfileData } from '../types'
import {
  formatCurrency,
  getAvailableForAllocation,
  getCoolingOffRemaining,
  getUnspentWants,
  getWishlistProgress,
  isCoolingOff,
  isFullyFunded,
} from '../utils/calculations'
import { getVisibleWishlistForDependant, statusColor } from '../utils/profiles'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { MoneyInput } from './ui/MoneyInput'
import { ProgressBar } from './ui/ProgressBar'

interface WishlistProps {
  data: ProfileData
  onAdd: (name: string, targetAmount: number) => void
  onAllocate: (itemId: string, amount: number) => void
  onRemove: (id: string) => void
  onToggleAutoAllocate: (enabled: boolean) => void
}

export function Wishlist({ data, onAdd, onAllocate, onRemove, onToggleAutoAllocate }: WishlistProps) {
  const { profile, needsApproval, canAllocateWishlist, transactions, wishlist: allWishlist, wishlistAllocations } = data
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [allocateAmounts, setAllocateAmounts] = useState<Record<string, string>>({})
  const [, setTick] = useState(0)

  const wishlist = needsApproval ? getVisibleWishlistForDependant(allWishlist) : allWishlist
  const unspentWants = getUnspentWants(profile, transactions)
  const available = getAvailableForAllocation(profile, transactions, wishlistAllocations)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseFloat(target)
    if (!name.trim() || !parsed || parsed <= 0) return
    onAdd(name.trim(), parsed)
    setName('')
    setTarget('')
  }

  const handleAllocate = (itemId: string) => {
    const item = wishlist.find((i) => i.id === itemId)
    if (!item || isCoolingOff(item)) return
    const raw = parseFloat(allocateAmounts[itemId] || '0')
    if (!raw || raw <= 0) return
    const roomLeft = item.targetAmount - item.savedAmount
    const amount = Math.min(raw, available, roomLeft)
    if (amount <= 0) return
    onAllocate(itemId, amount)
    setAllocateAmounts((prev) => ({ ...prev, [itemId]: '' }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Wishlist Buffer</h2>
        <p className="text-text-muted text-sm mt-1">
          {needsApproval
            ? `Save toward goals — new items need sponsor approval, then a ${COOLING_OFF_HOURS}h cooling-off period`
            : `Save toward goals with a ${COOLING_OFF_HOURS}-hour cooling-off period on new items`}
        </p>
      </div>

      {canAllocateWishlist && (
        <Card className="border-wishlist/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Unspent Wants Budget</p>
              <p className="text-2xl font-bold text-wishlist">{formatCurrency(unspentWants)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-muted">Available to allocate</p>
              <p className="text-lg font-semibold">{formatCurrency(available)}</p>
            </div>
          </div>
          <label className="flex items-center gap-3 mt-4 pt-4 border-t border-border cursor-pointer">
            <input type="checkbox" checked={profile.autoAllocateWants} onChange={(e) => onToggleAutoAllocate(e.target.checked)} className="w-4 h-4 accent-wishlist rounded" />
            <div>
              <p className="text-sm font-medium">Auto-allocate unspent wants</p>
              <p className="text-xs text-text-muted">Route leftover wants budget to active wishlist items at month end</p>
            </div>
          </label>
        </Card>
      )}

      {needsApproval && unspentWants > 0 && (
        <Card className="border-wishlist/20 bg-wishlist/5">
          <p className="text-sm text-wishlist">
            You have {formatCurrency(unspentWants)} in unspent wants. A sponsor can allocate it toward approved wishlist items.
          </p>
        </Card>
      )}

      <Card>
        <h3 className="font-semibold mb-4">Add Wishlist Item</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-muted">Item or experience</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New game, bike, concert tickets" className="w-full" />
          </div>
          <MoneyInput label="Target amount" value={target} onChange={setTarget} placeholder="0.00" />
          <Button type="submit" variant="secondary" className="w-full" disabled={!name.trim() || !target}>
            {needsApproval ? 'Submit for Approval' : 'Add to Wishlist'}
          </Button>
        </form>
      </Card>

      {wishlist.length === 0 ? (
        <Card><p className="text-text-muted text-sm text-center py-8">Your wishlist is empty.</p></Card>
      ) : (
        <div className="space-y-4">
          {wishlist.map((item) => {
            const cooling = isCoolingOff(item)
            const remaining = getCoolingOffRemaining(item)
            const progress = getWishlistProgress(item)
            const funded = isFullyFunded(item)
            const roomLeft = item.targetAmount - item.savedAmount
            const isPending = item.status === 'pending'
            const isRejected = item.status === 'rejected'

            return (
              <Card key={item.id} className={funded ? 'border-income/30' : isPending ? 'border-wishlist/30' : cooling ? 'border-wishlist/20 opacity-90' : isRejected ? 'opacity-60' : ''}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    <p className="text-sm text-text-muted mt-0.5">{formatCurrency(item.savedAmount)} of {formatCurrency(item.targetAmount)}</p>
                  </div>
                  {funded ? (
                    <span className="shrink-0 text-xs font-semibold bg-income/20 text-income px-2 py-1 rounded-lg">Funded!</span>
                  ) : isPending ? (
                    <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-lg ${statusColor('pending')}`}>Awaiting approval</span>
                  ) : isRejected ? (
                    <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-lg ${statusColor('rejected')}`}>Rejected</span>
                  ) : cooling ? (
                    <span className="shrink-0 text-xs font-semibold bg-wishlist/20 text-wishlist px-2 py-1 rounded-lg">Cooling off</span>
                  ) : canAllocateWishlist ? (
                    <button onClick={() => onRemove(item.id)} className="shrink-0 text-xs text-text-muted hover:text-danger">Remove</button>
                  ) : null}
                </div>
                {item.status === 'approved' && <ProgressBar value={progress} color={funded ? 'income' : 'wishlist'} size="sm" />}
                {canAllocateWishlist && !cooling && !funded && item.status === 'approved' && (
                  <div className="mt-4 flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                      <input type="number" min="0" step="0.01" placeholder="Amount" value={allocateAmounts[item.id] || ''} onChange={(e) => setAllocateAmounts((prev) => ({ ...prev, [item.id]: e.target.value }))} className="w-full pl-7 text-sm" />
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => handleAllocate(item.id)} disabled={!allocateAmounts[item.id] || available <= 0}>Allocate</Button>
                    {available > 0 && <Button size="sm" onClick={() => onAllocate(item.id, Math.min(available, roomLeft))}>Max</Button>}
                  </div>
                )}
                {cooling && (
                  <div className="mt-3 bg-wishlist/10 border border-wishlist/20 rounded-lg px-3 py-2 text-sm">
                    <p className="text-wishlist font-medium">{remaining.hours}h {remaining.minutes}m remaining</p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
