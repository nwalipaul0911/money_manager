import { useEffect, useState } from 'react'
import { COOLING_OFF_HOURS } from '../constants'
import type { AppState } from '../types'
import {
  formatCurrency,
  getAvailableForAllocation,
  getCoolingOffRemaining,
  getUnspentWants,
  getWishlistProgress,
  isCoolingOff,
  isFullyFunded,
} from '../utils/calculations'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { MoneyInput } from './ui/MoneyInput'
import { ProgressBar } from './ui/ProgressBar'

interface WishlistProps {
  state: AppState
  onAdd: (name: string, targetAmount: number) => void
  onAllocate: (itemId: string, amount: number) => void
  onRemove: (id: string) => void
  onToggleAutoAllocate: (enabled: boolean) => void
}

export function Wishlist({ state, onAdd, onAllocate, onRemove, onToggleAutoAllocate }: WishlistProps) {
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [allocateAmounts, setAllocateAmounts] = useState<Record<string, string>>({})
  const [, setTick] = useState(0)

  const unspentWants = getUnspentWants(state)
  const available = getAvailableForAllocation(state)

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
    const item = state.wishlist.find((i) => i.id === itemId)
    if (!item || isCoolingOff(item)) return
    const raw = parseFloat(allocateAmounts[itemId] || '0')
    if (!raw || raw <= 0) return
    const roomLeft = item.targetAmount - item.savedAmount
    const amount = Math.min(raw, available, roomLeft)
    if (amount <= 0) return
    onAllocate(itemId, amount)
    setAllocateAmounts((prev) => ({ ...prev, [itemId]: '' }))
  }

  const handleAllocateAll = (itemId: string, max: number) => {
    if (max <= 0) return
    onAllocate(itemId, max)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Wishlist Buffer</h2>
        <p className="text-text-muted text-sm mt-1">
          Save toward goals with a {COOLING_OFF_HOURS}-hour cooling-off period on new items
        </p>
      </div>

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
          <input
            type="checkbox"
            checked={state.autoAllocateWants}
            onChange={(e) => onToggleAutoAllocate(e.target.checked)}
            className="w-4 h-4 accent-wishlist rounded"
          />
          <div>
            <p className="text-sm font-medium">Auto-allocate unspent wants</p>
            <p className="text-xs text-text-muted">
              Route leftover wants budget to active wishlist items at month end
            </p>
          </div>
        </label>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">Add Wishlist Item</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-muted">Item or experience</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New headphones, weekend trip"
              className="w-full"
            />
          </div>
          <MoneyInput label="Target amount" value={target} onChange={setTarget} placeholder="0.00" />
          <p className="text-xs text-text-muted flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-wishlist animate-pulse" />
            New items enter a {COOLING_OFF_HOURS}-hour cooling-off period before funding
          </p>
          <Button type="submit" variant="secondary" className="w-full" disabled={!name.trim() || !target}>
            Add to Wishlist
          </Button>
        </form>
      </Card>

      {state.wishlist.length === 0 ? (
        <Card>
          <p className="text-text-muted text-sm text-center py-8">
            Your wishlist is empty. Add something you're saving toward!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {state.wishlist.map((item) => {
            const cooling = isCoolingOff(item)
            const remaining = getCoolingOffRemaining(item)
            const progress = getWishlistProgress(item)
            const funded = isFullyFunded(item)
            const roomLeft = item.targetAmount - item.savedAmount

            return (
              <Card
                key={item.id}
                className={funded ? 'border-income/30' : cooling ? 'border-wishlist/20 opacity-90' : ''}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    <p className="text-sm text-text-muted mt-0.5">
                      {formatCurrency(item.savedAmount)} of {formatCurrency(item.targetAmount)}
                    </p>
                  </div>
                  {funded ? (
                    <span className="shrink-0 text-xs font-semibold bg-income/20 text-income px-2 py-1 rounded-lg">
                      Funded!
                    </span>
                  ) : cooling ? (
                    <span className="shrink-0 text-xs font-semibold bg-wishlist/20 text-wishlist px-2 py-1 rounded-lg">
                      Cooling off
                    </span>
                  ) : (
                    <button
                      onClick={() => onRemove(item.id)}
                      className="shrink-0 text-xs text-text-muted hover:text-danger"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <ProgressBar value={progress} color={funded ? 'income' : 'wishlist'} size="sm" />

                {cooling && (
                  <div className="mt-3 bg-wishlist/10 border border-wishlist/20 rounded-lg px-3 py-2 text-sm">
                    <p className="text-wishlist font-medium">
                      {remaining.hours}h {remaining.minutes}m remaining
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Impulse guard active — funding unlocks after cooling off
                    </p>
                  </div>
                )}

                {!cooling && !funded && (
                  <div className="mt-4 flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount"
                        value={allocateAmounts[item.id] || ''}
                        onChange={(e) =>
                          setAllocateAmounts((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        className="w-full pl-7 text-sm"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAllocate(item.id)}
                      disabled={!allocateAmounts[item.id] || available <= 0}
                    >
                      Allocate
                    </Button>
                    {available > 0 && (
                      <Button
                        size="sm"
                        onClick={() => handleAllocateAll(item.id, Math.min(available, roomLeft))}
                      >
                        Max
                      </Button>
                    )}
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
