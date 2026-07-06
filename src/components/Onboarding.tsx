import { useState } from 'react'
import { DEFAULT_WANTS_BUDGET_PERCENT } from '../constants'
import type { FixedExpense } from '../types'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { MoneyInput } from './ui/MoneyInput'

interface OnboardingProps {
  defaultName: string
  onComplete: (data: {
    name: string
    net_income: number
    wants_budget_percent: number
    fixed_expenses: FixedExpense[]
  }) => Promise<void>
}

export function Onboarding({ defaultName, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState(defaultName)
  const [income, setIncome] = useState('')
  const [wantsPct, setWantsPct] = useState(String(DEFAULT_WANTS_BUDGET_PERCENT))
  const [expenses, setExpenses] = useState<FixedExpense[]>([])
  const [expenseName, setExpenseName] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const incomeNum = parseFloat(income) || 0
  const fixedTotal = expenses.reduce((s, e) => s + e.amount, 0)
  const discretionary = Math.max(0, incomeNum - fixedTotal)

  const addExpense = () => {
    const amount = parseFloat(expenseAmount)
    if (!expenseName.trim() || !amount || amount <= 0) return
    setExpenses((prev) => [...prev, { id: crypto.randomUUID(), name: expenseName.trim(), amount }])
    setExpenseName('')
    setExpenseAmount('')
  }

  const finish = async () => {
    setLoading(true)
    try {
      await onComplete({
        name: name.trim(),
        net_income: incomeNum,
        wants_budget_percent: parseFloat(wantsPct) || DEFAULT_WANTS_BUDGET_PERCENT,
        fixed_expenses: expenses,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Set Up Your Budget</h1>
          <p className="text-text-muted mt-2">Step {step} of 2</p>
        </div>

        {step === 1 && (
          <Card className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-muted">Display name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full" />
            </div>
            <MoneyInput label="Monthly net income" value={income} onChange={setIncome} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-muted">Wants budget ({wantsPct}%)</label>
              <input type="range" min="10" max="70" step="5" value={wantsPct} onChange={(e) => setWantsPct(e.target.value)} className="w-full accent-wants" />
            </div>
            <Button className="w-full" disabled={!incomeNum} onClick={() => setStep(2)}>Next</Button>
          </Card>
        )}

        {step === 2 && (
          <Card className="space-y-4">
            <h3 className="font-semibold">Fixed expenses (optional)</h3>
            <div className="flex gap-2">
              <input className="flex-1 text-sm" placeholder="Name" value={expenseName} onChange={(e) => setExpenseName(e.target.value)} />
              <input type="number" className="w-24 text-sm" placeholder="Amt" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
              <Button size="sm" variant="secondary" onClick={addExpense}>Add</Button>
            </div>
            {expenses.length > 0 && (
              <ul className="space-y-2">
                {expenses.map((e) => (
                  <li key={e.id} className="flex justify-between text-sm bg-surface-overlay rounded-lg px-3 py-2">
                    <span>{e.name}</span>
                    <span>${e.amount}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="bg-surface-overlay rounded-xl p-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-text-muted">Discretionary</span><span className="text-income">${discretionary.toLocaleString()}</span></div>
              <div className="flex justify-between text-wants"><span>Wants budget</span><span>${((discretionary * parseFloat(wantsPct)) / 100).toLocaleString()}</span></div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" disabled={loading} onClick={finish}>{loading ? 'Saving…' : 'Get Started'}</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
