import { useState } from 'react'
import { CATEGORIES_BY_PILLAR } from '../constants'
import type { AppState, Pillar } from '../types'
import { formatCurrency, getTransactionsForMonth } from '../utils/calculations'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { MoneyInput } from './ui/MoneyInput'

interface ExpenseLoggerProps {
  state: AppState
  onAdd: (amount: number, date: string, category: string, pillar: Pillar, note?: string) => void
  onDelete: (id: string) => void
}

export function ExpenseLogger({ state, onAdd, onDelete }: ExpenseLoggerProps) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [pillar, setPillar] = useState<Pillar>('needs')
  const [category, setCategory] = useState(CATEGORIES_BY_PILLAR.needs[0])
  const [note, setNote] = useState('')
  const [success, setSuccess] = useState(false)

  const transactions = getTransactionsForMonth(state.transactions)

  const handlePillarChange = (p: Pillar) => {
    setPillar(p)
    setCategory(CATEGORIES_BY_PILLAR[p][0])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) return
    onAdd(parsed, date, category, pillar, note || undefined)
    setAmount('')
    setNote('')
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Log Expense</h2>
        <p className="text-text-muted text-sm mt-1">Track daily spending as Needs or Wants</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-overlay rounded-xl">
            {(['needs', 'wants'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePillarChange(p)}
                className={`py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                  pillar === p
                    ? p === 'needs'
                      ? 'bg-needs text-white shadow-lg'
                      : 'bg-wants text-white shadow-lg'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <MoneyInput
            label="Amount"
            value={amount}
            onChange={setAmount}
            placeholder="0.00"
            autoFocus
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-muted">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-muted">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full"
            >
              {CATEGORIES_BY_PILLAR[pillar].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-muted">Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was this for?"
              className="w-full"
            />
          </div>

          <Button type="submit" className="w-full" disabled={!amount || parseFloat(amount) <= 0}>
            {success ? 'Logged!' : 'Add Transaction'}
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">This Month ({transactions.length})</h3>
        {transactions.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-4">No expenses logged yet.</p>
        ) : (
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {transactions.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between bg-surface-overlay rounded-lg px-3 py-2.5 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`shrink-0 text-xs font-semibold uppercase px-2 py-0.5 rounded ${
                      t.pillar === 'needs'
                        ? 'bg-needs/20 text-needs'
                        : 'bg-wants/20 text-wants'
                    }`}
                  >
                    {t.pillar}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{t.category}</p>
                    <p className="text-xs text-text-muted">
                      {t.date}{t.note ? ` · ${t.note}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-sm">{formatCurrency(t.amount)}</span>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger text-xs transition-opacity"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
