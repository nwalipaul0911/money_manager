import { useState } from 'react'
import { DEFAULT_WANTS_BUDGET_PERCENT } from '../constants'
import type { FixedExpense } from '../types'
import { generateId } from '../storage'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { MoneyInput } from './ui/MoneyInput'

interface OnboardingProps {
  onComplete: (netIncome: number, fixedExpenses: FixedExpense[], wantsBudgetPercent: number) => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [netIncome, setNetIncome] = useState('')
  const [wantsPercent, setWantsPercent] = useState(String(DEFAULT_WANTS_BUDGET_PERCENT))
  const [expenses, setExpenses] = useState<FixedExpense[]>([])
  const [expenseName, setExpenseName] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')

  const income = parseFloat(netIncome) || 0
  const fixedTotal = expenses.reduce((s, e) => s + e.amount, 0)
  const discretionary = Math.max(0, income - fixedTotal)
  const wantsPct = parseFloat(wantsPercent) || DEFAULT_WANTS_BUDGET_PERCENT

  const addExpense = () => {
    const amount = parseFloat(expenseAmount)
    if (!expenseName.trim() || !amount || amount <= 0) return
    setExpenses((prev) => [...prev, { id: generateId(), name: expenseName.trim(), amount }])
    setExpenseName('')
    setExpenseAmount('')
  }

  const removeExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  const canProceedStep0 = income > 0
  const canFinish = income > 0

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-income/20 text-income text-2xl mb-4">
            $
          </div>
          <h1 className="text-2xl font-bold text-text">Welcome to Money Manager</h1>
          <p className="text-text-muted mt-2">Set up your monthly budget in a few steps</p>
        </div>

        <div className="flex gap-2 mb-6">
          {[0, 1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-income' : 'bg-surface-overlay'}`}
            />
          ))}
        </div>

        <Card>
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Monthly Net Income</h2>
                <p className="text-sm text-text-muted mt-1">
                  Enter your take-home pay after taxes and deductions.
                </p>
              </div>
              <MoneyInput
                label="Net income"
                value={netIncome}
                onChange={setNetIncome}
                placeholder="0.00"
                autoFocus
              />
              <Button className="w-full" disabled={!canProceedStep0} onClick={() => setStep(1)}>
                Continue
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Fixed Expenses</h2>
                <p className="text-sm text-text-muted mt-1">
                  Add recurring monthly commitments like rent, utilities, and insurance.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  className="flex-1"
                  placeholder="Expense name"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addExpense()}
                />
                <input
                  type="number"
                  className="w-28"
                  placeholder="Amount"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addExpense()}
                />
                <Button variant="secondary" onClick={addExpense}>Add</Button>
              </div>

              {expenses.length > 0 && (
                <ul className="space-y-2">
                  {expenses.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between bg-surface-overlay rounded-lg px-3 py-2"
                    >
                      <span>{e.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-text-muted">${e.amount.toLocaleString()}</span>
                        <button
                          onClick={() => removeExpense(e.id)}
                          className="text-text-muted hover:text-danger text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
                <Button className="flex-1" onClick={() => setStep(2)}>
                  {expenses.length === 0 ? 'Skip for now' : 'Continue'}
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Wants Budget</h2>
                <p className="text-sm text-text-muted mt-1">
                  What share of your discretionary income goes to lifestyle spending?
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-muted">
                  Wants budget ({wantsPct}% of discretionary)
                </label>
                <input
                  type="range"
                  min="10"
                  max="70"
                  step="5"
                  value={wantsPct}
                  onChange={(e) => setWantsPercent(e.target.value)}
                  className="w-full accent-wants"
                />
                <div className="flex justify-between text-xs text-text-muted">
                  <span>10%</span>
                  <span className="text-wants font-medium">{wantsPct}%</span>
                  <span>70%</span>
                </div>
              </div>

              <div className="bg-surface-overlay rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Net income</span>
                  <span>${income.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Fixed expenses</span>
                  <span className="text-danger">−${fixedTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-medium">
                  <span>Discretionary pool</span>
                  <span className="text-income">${discretionary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-wants">
                  <span>Monthly wants budget</span>
                  <span>${((discretionary * wantsPct) / 100).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button
                  className="flex-1"
                  disabled={!canFinish}
                  onClick={() => onComplete(income, expenses, wantsPct)}
                >
                  Get Started
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
