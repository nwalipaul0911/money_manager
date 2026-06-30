import type { AppState } from '../types'
import { formatCurrency, sumFixedExpenses } from '../utils/calculations'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { MoneyInput } from './ui/MoneyInput'
import { useState } from 'react'
import type { FixedExpense } from '../types'
import { generateId } from '../storage'

interface SettingsProps {
  state: AppState
  onUpdate: (patch: Partial<AppState>) => void
  onReset: () => void
}

export function Settings({ state, onUpdate, onReset }: SettingsProps) {
  const [income, setIncome] = useState(String(state.netIncome))
  const [wantsPercent, setWantsPercent] = useState(String(state.wantsBudgetPercent))
  const [expenseName, setExpenseName] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')

  const saveIncome = () => {
    const val = parseFloat(income)
    if (val > 0) onUpdate({ netIncome: val })
  }

  const saveWantsPercent = () => {
    const val = parseFloat(wantsPercent)
    if (val >= 10 && val <= 70) onUpdate({ wantsBudgetPercent: val })
  }

  const addExpense = () => {
    const amount = parseFloat(expenseAmount)
    if (!expenseName.trim() || !amount || amount <= 0) return
    const expense: FixedExpense = { id: generateId(), name: expenseName.trim(), amount }
    onUpdate({ fixedExpenses: [...state.fixedExpenses, expense] })
    setExpenseName('')
    setExpenseAmount('')
  }

  const removeExpense = (id: string) => {
    onUpdate({ fixedExpenses: state.fixedExpenses.filter((e) => e.id !== id) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Settings</h2>
        <p className="text-text-muted text-sm mt-1">Update your budget configuration</p>
      </div>

      <Card>
        <h3 className="font-semibold mb-4">Income & Budget</h3>
        <div className="space-y-4">
          <MoneyInput label="Monthly net income" value={income} onChange={setIncome} />
          <Button size="sm" variant="secondary" onClick={saveIncome}>Save income</Button>

          <div className="space-y-1.5 pt-2">
            <label className="block text-sm font-medium text-text-muted">
              Wants budget ({wantsPercent}%)
            </label>
            <input
              type="range"
              min="10"
              max="70"
              step="5"
              value={wantsPercent}
              onChange={(e) => setWantsPercent(e.target.value)}
              className="w-full accent-wants"
            />
          </div>
          <Button size="sm" variant="secondary" onClick={saveWantsPercent}>Save wants %</Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">
          Fixed Expenses ({formatCurrency(sumFixedExpenses(state))}/mo)
        </h3>
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 text-sm"
            placeholder="Name"
            value={expenseName}
            onChange={(e) => setExpenseName(e.target.value)}
          />
          <input
            type="number"
            className="w-24 text-sm"
            placeholder="Amt"
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
          />
          <Button size="sm" variant="secondary" onClick={addExpense}>Add</Button>
        </div>
        <ul className="space-y-2">
          {state.fixedExpenses.map((e) => (
            <li key={e.id} className="flex justify-between items-center bg-surface-overlay rounded-lg px-3 py-2 text-sm">
              <span>{e.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-text-muted">{formatCurrency(e.amount)}</span>
                <button onClick={() => removeExpense(e.id)} className="text-text-muted hover:text-danger text-xs">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="border-danger/20">
        <h3 className="font-semibold text-danger mb-2">Danger Zone</h3>
        <p className="text-sm text-text-muted mb-4">Reset all data and start over from onboarding.</p>
        <Button variant="danger" size="sm" onClick={() => {
          if (confirm('Reset all data? This cannot be undone.')) onReset()
        }}>
          Reset App
        </Button>
      </Card>
    </div>
  )
}
